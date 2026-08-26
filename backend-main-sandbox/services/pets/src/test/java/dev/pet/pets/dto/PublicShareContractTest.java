package dev.pet.pets.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import org.junit.jupiter.api.Test;

class PublicShareContractTest {
    @Test
    void publicPetContractCannotExposePrivateIdentifiersOrPassport() {
        assertSafe(PublicPetProfileResponse.class);
        assertSafe(PublicPetProfileResponse.PetDetails.class);
        assertSafe(PublicPetProfileResponse.HealthEntry.class);
        assertSafe(PublicPetProfileResponse.RecipeSummary.class);
    }

    @Test
    void publicRecipeContractCannotExposePrivateIdentifiersOrStorageKeys() {
        assertSafe(PublicRecipeResponse.class);
        assertSafe(PublicRecipeResponse.LinkedPet.class);
        assertSafe(PublicRecipeResponse.IngredientItem.class);
    }

    private void assertSafe(Class<?> type) {
        assertThat(Arrays.stream(type.getRecordComponents()).map(component -> component.getName().toLowerCase()))
            .noneMatch(name -> name.equals("id") || name.contains("owner") || name.contains("passport")
                || name.contains("objectkey") || name.contains("photourl") || name.contains("share"));
    }
}
