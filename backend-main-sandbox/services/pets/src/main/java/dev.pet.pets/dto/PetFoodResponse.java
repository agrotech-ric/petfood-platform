package dev.pet.pets.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PetFoodResponse(
    UUID id,
    UUID petId,
    String name,
    String type,
    String format,
    Integer calories,
    OffsetDateTime updatedAt
) {}
