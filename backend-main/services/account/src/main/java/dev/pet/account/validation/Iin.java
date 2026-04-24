package dev.pet.account.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = IinValidator.class)
@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface Iin {

    String message() default "IIN is not valid";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
