package dev.pet.pets.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PetOwnerResponse(
    UUID id,
    String fullName,
    String country,
    String city,
    String address,
    String phone,
    String email,
    String telegram,
    String avatarObjectKey,
    boolean placeholder,
    long petCount,
    long activeRecordCount,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
