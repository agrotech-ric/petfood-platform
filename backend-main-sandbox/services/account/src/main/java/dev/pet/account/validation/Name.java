package dev.pet.account.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = NameValidator.class)
@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface Name {
    String message() default
        "Имя/фамилия: только буквы, пробел, дефис, апостроф; минимум 1 символ";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
