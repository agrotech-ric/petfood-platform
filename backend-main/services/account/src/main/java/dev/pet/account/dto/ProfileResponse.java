package dev.pet.account.dto;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ProfileResponse(
    UUID id,
    String email,
    String firstName,
    String lastName,
//    String phone,
    String role,
    OffsetDateTime createdAt
) { }
