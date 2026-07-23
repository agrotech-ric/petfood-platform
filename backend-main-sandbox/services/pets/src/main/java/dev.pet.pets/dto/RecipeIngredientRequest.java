package dev.pet.pets.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record RecipeIngredientRequest(
    @NotNull Long ingredientId,
    @DecimalMin("0.0") @DecimalMax("100.0") double minPercent,
    @DecimalMin("0.0") @DecimalMax("100.0") double maxPercent,
    @DecimalMin("0.0") Double resultPercent,
    @DecimalMin("0.0") Double resultGrams
) {
}
