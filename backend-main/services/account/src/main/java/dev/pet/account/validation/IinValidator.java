package dev.pet.account.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class IinValidator implements ConstraintValidator<Iin, String> {

    @Override
    public boolean isValid(String raw, ConstraintValidatorContext ctx) {
        if (raw == null) return false;
        String iin = raw.trim();

        if (iin.length() != 12) {
            return false;
        }

        for (int i = 0; i < 12; i++) {
            char c = iin.charAt(i);
            if (c < '0' || c > '9') {
                return false;
            }
        }
        int mm = parse2(iin.substring(2, 4));
        int dd = parse2(iin.substring(4, 6));

        if (mm < 1 || mm > 12) {
            return false;
        }

        if (dd < 1 || dd > 31) {
            return false;
        }

        return true;
    }

    private int parse2(String s) {
        try {
            return Integer.parseInt(s);
        } catch (NumberFormatException e) {
            return -1;
        }
    }
}
