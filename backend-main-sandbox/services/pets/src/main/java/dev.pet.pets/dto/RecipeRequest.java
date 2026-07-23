package dev.pet.pets.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record RecipeRequest(
    UUID petId,
    @NotBlank @Size(max = 255) String name,
    String description,
    @NotBlank @Pattern(regexp = "domestic|commercial") String type,
    @NotBlank @Pattern(regexp = "wet|dry") String format,
    @NotBlank @Pattern(regexp = "puppies|adults|senior") String ageCategory,
    @NotBlank @Pattern(regexp = "all|small|medium|large") String breedSize,
    @DecimalMin(value = "0.0", inclusive = false) Double targetWeightKg,
    Long targetBreedId,
    @Min(0) Integer targetAgeMonths,
    @Pattern(regexp = "male|female") String targetGender,
    Long targetActivityTypeId,
    Long targetReproductiveStatusId,
    Long targetHealthConditionId,
    List<Long> symptomIds,
    @DecimalMin(value = "0.0", inclusive = false) Double targetEnergyKcal,
    @Size(max = 64) String maximizeNutrient,
    List<@Valid RecipeIngredientRequest> ingredients,
    List<@Valid RecipeNutrientConstraintRequest> nutrientConstraints,
    JsonNode calculationResult,
    @Size(max = 64) String calculationVersion
) {
}
