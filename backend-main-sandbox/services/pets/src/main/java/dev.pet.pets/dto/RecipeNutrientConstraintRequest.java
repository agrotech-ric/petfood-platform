package dev.pet.pets.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RecipeNutrientConstraintRequest(
    @NotBlank @Size(max = 64) String nutrientKey,
    @DecimalMin("0.0") double minValue,
    @DecimalMin("0.0") double maxValue
) {
}
