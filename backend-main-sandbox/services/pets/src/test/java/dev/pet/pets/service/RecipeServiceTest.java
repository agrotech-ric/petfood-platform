package dev.pet.pets.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import dev.pet.pets.domain.Recipe;
import dev.pet.pets.dto.RecipeRequest;
import dev.pet.pets.error.BadRequestException;
import dev.pet.pets.error.NotFoundException;
import dev.pet.pets.repo.ActivityTypeRepository;
import dev.pet.pets.repo.BreedRepository;
import dev.pet.pets.repo.HealthConditionRepository;
import dev.pet.pets.repo.IngredientRepository;
import dev.pet.pets.repo.PetRepository;
import dev.pet.pets.repo.RecipeRepository;
import dev.pet.pets.repo.ReproductiveStatusRepository;
import dev.pet.pets.repo.SymptomRepository;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.oauth2.jwt.Jwt;

class RecipeServiceTest {

    private RecipeRepository recipeRepository;
    private RecipeService service;

    @BeforeEach
    void setUp() {
        recipeRepository = mock(RecipeRepository.class);
        service = new RecipeService(
            recipeRepository,
            mock(PetRepository.class),
            mock(IngredientRepository.class),
            mock(BreedRepository.class),
            mock(ActivityTypeRepository.class),
            mock(ReproductiveStatusRepository.class),
            mock(HealthConditionRepository.class),
            mock(SymptomRepository.class)
        );
        when(recipeRepository.save(any(Recipe.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void createsAndUpdatesFormatNeutralRecipe() {
        UUID ownerId = UUID.randomUUID();
        Jwt jwt = jwt(ownerId);

        var created = service.create(jwt, request("First recipe"));

        assertThat(created.name()).isEqualTo("First recipe");
        assertThat(created.ageCategory()).isEqualTo("adults");
        assertThat(Arrays.stream(created.getClass().getRecordComponents()).map(component -> component.getName()))
            .doesNotContain("format");

        Recipe existing = recipe("Existing recipe", ownerId);
        when(recipeRepository.findByIdAndOwnerId(7L, ownerId)).thenReturn(Optional.of(existing));

        var updated = service.update(jwt, 7L, request("Updated recipe"));

        assertThat(updated.name()).isEqualTo("Updated recipe");
        assertThat(existing.getName()).isEqualTo("Updated recipe");
    }

    @Test
    @SuppressWarnings("unchecked")
    void listsExistingRecipesAndRejectsFormatAsSortField() {
        UUID ownerId = UUID.randomUUID();
        Recipe existing = recipe("Existing recipe", ownerId);
        when(recipeRepository.findAll(any(Specification.class), any(Sort.class)))
            .thenReturn(List.of(existing));

        var result = service.listMine(
            jwt(ownerId),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            "format",
            "asc"
        );

        assertThat(result).singleElement().satisfies(item -> {
            assertThat(item.name()).isEqualTo("Existing recipe");
            assertThat(Arrays.stream(item.getClass().getRecordComponents()).map(component -> component.getName()))
                .doesNotContain("format");
        });
        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        verify(recipeRepository).findAll(any(Specification.class), sortCaptor.capture());
        assertThat(sortCaptor.getValue().getOrderFor("updatedAt")).isNotNull();
        assertThat(sortCaptor.getValue().getOrderFor("format")).isNull();
    }

    @Test
    void requestContractDoesNotContainFormat() {
        assertThat(Arrays.stream(RecipeRequest.class.getRecordComponents()).map(component -> component.getName()))
            .doesNotContain("format");
        assertThat(Arrays.stream(Recipe.class.getDeclaredFields()).map(field -> field.getName()))
            .doesNotContain("format");
    }

    @Test
    void createsAndUpdatesUnnamedInputOnlyDraft() {
        UUID ownerId = UUID.randomUUID();
        Jwt jwt = jwt(ownerId);

        var created = service.create(jwt, request(""));

        assertThat(created.name()).isEmpty();
        assertThat(created.status()).isEqualTo("draft");
        assertThat(created.calculationResult()).isNull();

        Recipe existing = recipe("Temporary name", ownerId);
        when(recipeRepository.findByIdAndOwnerId(7L, ownerId)).thenReturn(Optional.of(existing));

        var updated = service.update(jwt, 7L, request("   "));

        assertThat(updated.name()).isEmpty();
        assertThat(updated.status()).isEqualTo("draft");
    }

    @Test
    void calculatedRecipeRequiresNameAndStaleResultReturnsToDraft() {
        UUID ownerId = UUID.randomUUID();
        Jwt jwt = jwt(ownerId);
        RecipeRequest calculated = request("Calculated recipe", true);

        var created = service.create(jwt, calculated);

        assertThat(created.status()).isEqualTo("calculated");
        assertThat(created.calculationResult()).isNotNull();

        assertThatThrownBy(() -> service.create(jwt, request(" ", true)))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Recipe name is required");

        Recipe existing = recipe("Calculated recipe", ownerId);
        existing.setCalculationResult(JsonNodeFactory.instance.objectNode().put("calories", 120));
        existing.setCalculationVersion("recommender-1.0.0");
        existing.setCalculatedAt(OffsetDateTime.now());
        existing.setStatus("calculated");
        when(recipeRepository.findByIdAndOwnerId(9L, ownerId)).thenReturn(Optional.of(existing));

        var updated = service.update(jwt, 9L, request("Calculated recipe"));

        assertThat(updated.status()).isEqualTo("draft");
        assertThat(updated.calculationResult()).isNull();
        assertThat(updated.calculationVersion()).isNull();
        assertThat(updated.calculatedAt()).isNull();
    }

    @Test
    void doesNotExposeAnotherOwnersDraft() {
        UUID ownerId = UUID.randomUUID();
        UUID otherOwnerId = UUID.randomUUID();
        when(recipeRepository.findByIdAndOwnerId(11L, ownerId)).thenReturn(Optional.empty());
        when(recipeRepository.findByIdAndOwnerId(11L, otherOwnerId))
            .thenReturn(Optional.of(recipe("Private draft", otherOwnerId)));

        assertThatThrownBy(() -> service.getMine(jwt(ownerId), 11L))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("Recipe not found");
    }

    private RecipeRequest request(String name) {
        return request(name, false);
    }

    private RecipeRequest request(String name, boolean calculated) {
        return new RecipeRequest(
            null,
            name,
            "Description",
            "adults",
            "all",
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            List.of(),
            null,
            List.of(),
            List.of(),
            List.of(),
            calculated ? JsonNodeFactory.instance.objectNode().put("calories", 120) : null,
            calculated ? "recommender-1.0.0" : null
        );
    }

    private Recipe recipe(String name, UUID ownerId) {
        Recipe recipe = new Recipe();
        recipe.setOwnerId(ownerId);
        recipe.setName(name);
        recipe.setAgeCategory("adults");
        recipe.setBreedSize("all");
        recipe.setStatus("draft");
        recipe.setCreatedAt(OffsetDateTime.now().minusDays(1));
        recipe.setUpdatedAt(OffsetDateTime.now());
        return recipe;
    }

    private Jwt jwt(UUID ownerId) {
        return new Jwt(
            "token",
            Instant.now(),
            Instant.now().plusSeconds(60),
            Map.of("alg", "none"),
            Map.of("sub", ownerId.toString())
        );
    }
}
