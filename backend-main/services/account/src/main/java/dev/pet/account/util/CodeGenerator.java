package dev.pet.account.util;

import java.security.SecureRandom;

public final class CodeGenerator {
    private static final SecureRandom RND = new SecureRandom();

    private CodeGenerator() {}

    public static String numeric6() {
        int n = RND.nextInt(1_000_000);
        return String.format("%06d", n);
    }
}
