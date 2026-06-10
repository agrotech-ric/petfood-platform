package dev.pet.account.dto;

import jakarta.validation.constraints.Email;

public record PasswordResetStartRequest(
    @Email String email,
    String phone
) {}
