package dev.pet.account.service;

import dev.pet.account.config.AccountSecurityProperties;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Component
public class OtpGuard {
    private static final String INVALID_CODE = "Invalid or expired verification code";

    private final StringRedisTemplate redis;
    private final AccountSecurityProperties properties;

    public OtpGuard(StringRedisTemplate redis, AccountSecurityProperties properties) {
        this.redis = redis;
        this.properties = properties;
    }

    public void acquireIssuePermit(String purpose, String normalizedIdentity) {
        String key = prefix(purpose, normalizedIdentity) + ":cooldown";
        Boolean acquired = redis.opsForValue().setIfAbsent(key, "1", properties.getOtpCooldown());
        if (!Boolean.TRUE.equals(acquired)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Please retry later");
        }
    }

    public void recordFailedAttempt(String purpose, String normalizedIdentity, String codeKey) {
        String attemptsKey = prefix(purpose, normalizedIdentity) + ":attempts";
        Long attempts = redis.opsForValue().increment(attemptsKey);
        if (attempts != null && attempts == 1) {
            redis.expire(attemptsKey, properties.getOtpTtl());
        }
        if (attempts != null && attempts >= properties.getOtpMaxAttempts()) {
            redis.delete(codeKey);
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, INVALID_CODE);
    }

    public void clear(String purpose, String normalizedIdentity) {
        redis.delete(prefix(purpose, normalizedIdentity) + ":attempts");
    }

    private String prefix(String purpose, String identity) {
        return "otp:" + purpose + ":" + digest(identity);
    }

    private String digest(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(
                (properties.getRateLimitPepper() + ":" + value).getBytes(StandardCharsets.UTF_8)
            ));
        } catch (Exception e) {
            throw new IllegalStateException("Unable to derive OTP protection key", e);
        }
    }
}
