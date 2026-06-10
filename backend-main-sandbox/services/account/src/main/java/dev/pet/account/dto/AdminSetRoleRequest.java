package dev.pet.account.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminSetRoleRequest(
    @NotBlank String role
) {}
