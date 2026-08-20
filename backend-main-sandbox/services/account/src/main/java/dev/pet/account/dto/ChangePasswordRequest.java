package dev.pet.account.dto;

import dev.pet.account.validation.Password;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;


public record ChangePasswordRequest(
    @NotBlank(message = "Current password is required")
    String currentPassword,

    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 72, message = "Password must be 8..72 characters")
    @Password
    String newPassword
) {}
