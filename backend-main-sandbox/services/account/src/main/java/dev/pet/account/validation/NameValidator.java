package dev.pet.account.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

public class NameValidator implements ConstraintValidator<Name, String> {

    private static final Pattern NAME_PATTERN =
        Pattern.compile("^[\\p{L}][\\p{L}'\\-\\s]*$");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext ctx) {
        if (value == null) return true;

        String s = value.trim();
        if (s.isEmpty() || s.length() > 64) return false;
        return NAME_PATTERN.matcher(s).matches();
    }

}
