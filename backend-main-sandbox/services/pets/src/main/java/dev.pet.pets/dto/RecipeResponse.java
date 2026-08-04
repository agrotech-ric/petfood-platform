package dev.pet.pets.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record RecipeResponse(
    Long id,
    UUID ownerId,
    UUID petId,
    String petName,
    String name,
    String description,
    String format,
    String ageCategory,
    String breedSize,
    Double targetWeightKg,
    Long targetBreedId,
    String targetBreedName,
    Integer targetAgeMonths,
    String targetGender,
    Long targetActivityTypeId,
    String targetActivityTypeName,
    Long targetReproductiveStatusId,
    String targetReproductiveStatusName,
    Long targetHealthConditionId,
    String targetHealthConditionName,
    String targetDisorder,
    List<ReferenceItem> symptoms,
    Double targetEnergyKcal,
    List<String> maximizeNutrients,
    String status,
    List<IngredientItem> ingredients,
    List<NutrientConstraintItem> nutrientConstraints,
    JsonNode calculationResult,
    String calculationVersion,
    OffsetDateTime calculatedAt,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
    public record ReferenceItem(Long id, String name) {
    }

    public record IngredientItem(
        Long ingredientId,
        String name,
        String subtype,
        String category,
        double minPercent,
        double maxPercent,
        Double resultPercent,
        Double resultGrams
    ) {
    }

    public record NutrientConstraintItem(
        String nutrientKey,
        double minValue,
        double maxValue
    ) {
    }
}
