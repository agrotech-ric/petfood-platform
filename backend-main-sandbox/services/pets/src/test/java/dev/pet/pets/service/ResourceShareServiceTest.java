package dev.pet.pets.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import dev.pet.pets.config.ShareProperties;
import dev.pet.pets.domain.Pet;
import dev.pet.pets.domain.Recipe;
import dev.pet.pets.domain.ResourceShare;
import dev.pet.pets.domain.ShareResourceType;
import dev.pet.pets.error.BadRequestException;
import dev.pet.pets.error.NotFoundException;
import dev.pet.pets.repo.PetRepository;
import dev.pet.pets.repo.RecipeRepository;
import dev.pet.pets.repo.ResourceShareRepository;
import java.lang.reflect.Field;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

class ResourceShareServiceTest {
    private ResourceShareRepository shares;
    private PetRepository pets;
    private RecipeRepository recipes;
    private ResourceShareService service;
    private ShareTokenService tokens;

    @BeforeEach
    void setUp() {
        shares = mock(ResourceShareRepository.class);
        pets = mock(PetRepository.class);
        recipes = mock(RecipeRepository.class);
        ShareProperties properties = new ShareProperties();
        properties.setPublicBaseUrl("https://example.test/petfood");
        properties.setSigningSecret("0123456789abcdef0123456789abcdef");
        tokens = new ShareTokenService(properties);
        service = new ResourceShareService(shares, pets, recipes, tokens);
        when(shares.save(any(ResourceShare.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void petCreationIsIdempotentAndRotationRevokesTheOldLink() {
        UUID owner = UUID.randomUUID();
        Pet pet = pet(owner);
        ResourceShare existing = ResourceShare.forPet(pet, OffsetDateTime.now().minusDays(1));
        when(pets.findByIdForUpdate(pet.getId())).thenReturn(Optional.of(pet));
        when(shares.findActivePetForUpdate(pet.getId())).thenReturn(Optional.of(existing));

        var current = service.createPetShare(jwt(owner), pet.getId());
        assertThat(current.url()).contains(existing.getId().toString());
        verify(shares, never()).save(any(ResourceShare.class));

        var rotated = service.rotatePetShare(jwt(owner), pet.getId());
        assertThat(existing.getRevokedAt()).isNotNull();
        assertThat(rotated.url()).doesNotContain(existing.getId().toString());
        verify(shares).saveAndFlush(existing);
    }

    @Test
    void rejectsNonOwnerAndDraftRecipeWithoutDisclosingOwnership() {
        UUID owner = UUID.randomUUID();
        Recipe recipe = recipe(owner, false);
        when(recipes.findByIdForUpdate(42L)).thenReturn(Optional.of(recipe));

        assertThatThrownBy(() -> service.createRecipeShare(jwt(UUID.randomUUID()), 42L))
            .isInstanceOf(NotFoundException.class).hasMessage("Resource not found");
        assertThatThrownBy(() -> service.createRecipeShare(jwt(owner), 42L))
            .isInstanceOf(BadRequestException.class).hasMessageContaining("fully calculated");
    }

    @Test
    void publicResolutionRejectsWrongTypeRevocationAndEligibilityTransitionUniformly() {
        UUID owner = UUID.randomUUID();
        Recipe recipe = recipe(owner, true);
        ResourceShare share = ResourceShare.forRecipe(recipe, OffsetDateTime.now());
        String token = tokens.createToken(share.getId());
        when(shares.findByIdAndRevokedAtIsNull(share.getId())).thenReturn(Optional.of(share));

        assertThat(service.resolvePublic(token, ShareResourceType.RECIPE)).isSameAs(share);
        for (Runnable request : new Runnable[] {
            () -> service.resolvePublic(token, ShareResourceType.PET),
            () -> service.resolvePublic("invalid", ShareResourceType.RECIPE)
        }) {
            assertThatThrownBy(request::run).isInstanceOf(NotFoundException.class)
                .hasMessage("Shared resource not found");
        }
        recipe.setStatus("draft");
        assertThatThrownBy(() -> service.resolvePublic(token, ShareResourceType.RECIPE))
            .isInstanceOf(NotFoundException.class).hasMessage("Shared resource not found");
    }

    private Pet pet(UUID owner) {
        Pet pet = new Pet();
        pet.setId(UUID.randomUUID());
        pet.setOwnerId(owner);
        pet.setName("Ақтөс");
        return pet;
    }

    private Recipe recipe(UUID owner, boolean calculated) {
        Recipe recipe = new Recipe();
        setId(recipe, 42L);
        recipe.setOwnerId(owner);
        recipe.setName("Рецепт");
        recipe.setStatus(calculated ? "calculated" : "draft");
        if (calculated) {
            recipe.setCalculationResult(JsonNodeFactory.instance.objectNode().put("calories", 100));
            recipe.setCalculatedAt(OffsetDateTime.now());
        }
        return recipe;
    }

    private void setId(Recipe recipe, long id) {
        try {
            Field field = Recipe.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(recipe, id);
        } catch (ReflectiveOperationException ex) {
            throw new AssertionError(ex);
        }
    }

    private Jwt jwt(UUID subject) {
        Instant now = Instant.now();
        return new Jwt("token", now, now.plusSeconds(60), Map.of("alg", "none"), Map.of("sub", subject.toString()));
    }
}
