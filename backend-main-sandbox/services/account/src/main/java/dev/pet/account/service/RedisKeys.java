package dev.pet.account.service;

public final class RedisKeys {
    private RedisKeys() {}
    public static String confirmCode(String email) { return "acc:confirm:" + email; }
    public static String twoFaCode(String email) { return "acc:2fa:" + email; }
    public static String confirmCodeCooldown(String email) {return "register:confirm:cooldown:" + email;}
    public static String session(String sid) { return "session:" + sid; }
    public static String emailChange(java.util.UUID userId) { return "acc:email:chg:" + userId; }
    public static String passwordResetEmail(String email) { return "acc:pwd:reset:email:" + email; }

}
