package dev.pet.pets.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record PublicPetProfileResponse(
    PetDetails pet,
    List<HealthEntry> healthRecords,
    Contraindications contraindications,
    List<RecipeSummary> recipes
) {
    public record PetDetails(
        String name,
        String speciesName,
        String breedName,
        String gender,
        String colorName,
        LocalDate birthDate,
        Double weightKg,
        String reproductiveStatusName,
        String reproductiveSubStatusName,
        Integer puppiesCount,
        String comments,
        boolean photoAvailable,
        OffsetDateTime updatedAt
    ) {}

    public record HealthEntry(
        LocalDate recordDate,
        String conditionName,
        String conditionStatus,
        String activityTypeName,
        List<String> symptoms,
        String notes,
        Double weightKg,
        Double activityHours
    ) {}

    public record Contraindications(List<String> ingredients, String description) {}

    public record RecipeSummary(
        String name,
        String description,
        String ageCategory,
        String breedSize,
        Double calories,
        OffsetDateTime calculatedAt
    ) {}
}
