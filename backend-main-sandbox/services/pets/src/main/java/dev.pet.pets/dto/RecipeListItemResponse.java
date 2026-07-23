package dev.pet.pets.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record RecipeListItemResponse(
    Long id,
    UUID petId,
    String petName,
    String name,
    String type,
    String format,
    String ageCategory,
    String breedSize,
    String status,
    Double calories,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}
