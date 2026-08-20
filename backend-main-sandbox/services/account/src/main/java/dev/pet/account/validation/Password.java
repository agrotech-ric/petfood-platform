package dev.pet.account.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = PasswordValidator.class)
@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface Password {
    String message() default
        "Пароль должен быть не короче 8 символов и содержать: " +
            "минимум 1 строчную букву, 1 заглавную букву, 1 цифру и 1 спецсимвол";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
