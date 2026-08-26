package dev.pet.pets.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record PublicRecipeResponse(
    String name,
    String description,
    String ageCategory,
    String breedSize,
    Double targetWeightKg,
    String targetBreedName,
    Integer targetAgeMonths,
    String targetGender,
    String targetActivityTypeName,
    String targetReproductiveStatusName,
    String targetHealthConditionName,
    String targetDisorder,
    List<String> symptoms,
    Double targetEnergyKcal,
    List<String> maximizeNutrients,
    List<IngredientItem> ingredients,
    List<NutrientConstraintItem> nutrientConstraints,
    JsonNode calculationResult,
    String calculationVersion,
    OffsetDateTime calculatedAt,
    LinkedPet linkedPet
) {
    public record IngredientItem(
        String name,
        String subtype,
        String category,
        double minPercent,
        double maxPercent,
        Double resultPercent,
        Double resultGrams
    ) {}

    public record NutrientConstraintItem(String nutrientKey, double minValue, double maxValue) {}

    public record LinkedPet(
        String name,
        String speciesName,
        String breedName,
        LocalDate birthDate,
        Double weightKg,
        boolean photoAvailable
    ) {}
}
