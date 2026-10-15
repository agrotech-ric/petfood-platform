package dev.pet.pets.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dev.pet.pets.domain.Ingredient;
import dev.pet.pets.error.ForbiddenOperationException;
import dev.pet.pets.repo.IngredientRepository;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

class IngredientServiceTest {

    private IngredientRepository repository;
    private IngredientService service;

    @BeforeEach
    void setUp() {
        repository = mock(IngredientRepository.class);
        service = new IngredientService(repository);
    }

    @Test
    void curatedSystemIngredientCannotBeUpdatedOrDeleted() {
        Ingredient systemIngredient = new Ingredient();
        systemIngredient.setOwnerId(null);
        when(repository.findById(42L)).thenReturn(Optional.of(systemIngredient));
        Jwt jwt = jwt();

        assertThatThrownBy(() -> service.update(jwt, 42L, null))
            .isInstanceOf(ForbiddenOperationException.class)
            .hasMessage("System ingredients are read-only");
        assertThatThrownBy(() -> service.delete(jwt, 42L))
            .isInstanceOf(ForbiddenOperationException.class)
            .hasMessage("System ingredients are read-only");

        verify(repository, never()).save(any(Ingredient.class));
        verify(repository, never()).delete(any(Ingredient.class));
    }

    private Jwt jwt() {
        Instant now = Instant.now();
        return new Jwt(
            "token",
            now,
            now.plusSeconds(60),
            Map.of("alg", "none"),
            Map.of("sub", UUID.randomUUID().toString())
        );
    }

}
