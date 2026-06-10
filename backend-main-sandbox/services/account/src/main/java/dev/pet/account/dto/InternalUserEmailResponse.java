package dev.pet.account.dto;

import java.util.UUID;

public record InternalUserEmailResponse(
    UUID id,
    String email,
    String fullName
) {}
