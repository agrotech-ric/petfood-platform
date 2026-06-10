package dev.pet.account.dto;

import dev.pet.account.validation.Password;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordResetConfirmRequest(
    @Email String email,
    String phone,
    @NotBlank String code,
    @NotBlank @Size(min = 8, max = 72) @Password String newPassword
) {}
