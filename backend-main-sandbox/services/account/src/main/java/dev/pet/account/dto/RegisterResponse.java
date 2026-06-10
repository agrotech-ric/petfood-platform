package dev.pet.account.dto;

import java.util.UUID;

public record RegisterResponse(UUID userId, String email, String status) {}
