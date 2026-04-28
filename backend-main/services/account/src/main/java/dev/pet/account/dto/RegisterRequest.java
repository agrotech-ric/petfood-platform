package dev.pet.account.dto;

import dev.pet.account.validation.Iin;
import dev.pet.account.validation.Password;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    String email,
   // @NotBlank(message = "IIN is required")
    //@Iin
    //String iin,

    @NotBlank(message = "First name is required")
    String firstName,

    @NotBlank(message = "Last name is required")
    String lastName,
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
    @Password
    String password
) {}
