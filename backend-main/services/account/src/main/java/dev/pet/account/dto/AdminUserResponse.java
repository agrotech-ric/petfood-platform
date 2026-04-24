package dev.pet.account.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AdminUserResponse(
    UUID id,
    String email,
    String iin,
    String firstName,
    String lastName,
    String status,
    String role,
    OffsetDateTime createdAt
) {}
