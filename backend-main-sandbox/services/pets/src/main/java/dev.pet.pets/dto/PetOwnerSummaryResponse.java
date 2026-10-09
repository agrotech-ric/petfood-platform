package dev.pet.pets.dto;

import java.util.UUID;

public record PetOwnerSummaryResponse(
    UUID id,
    String fullName,
    String phone,
    String email,
    String telegram,
    String avatarObjectKey,
    boolean placeholder
) {}
