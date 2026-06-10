package dev.pet.account.dto;

import java.util.UUID;

public record BioOwnerResponse(
    UUID id,
    String fullName
) {}
