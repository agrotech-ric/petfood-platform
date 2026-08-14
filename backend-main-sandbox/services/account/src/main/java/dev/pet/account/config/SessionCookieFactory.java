package dev.pet.account.config;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class SessionCookieFactory {
    private final AccountSecurityProperties properties;

    public SessionCookieFactory(AccountSecurityProperties properties) {
        this.properties = properties;
    }

    public ResponseCookie create(String sid) {
        return cookie(sid, properties.getSessionTtl());
    }

    public ResponseCookie clear() {
        return cookie("", Duration.ZERO);
    }

    private ResponseCookie cookie(String value, Duration maxAge) {
        return ResponseCookie.from("sid", value)
            .httpOnly(true)
            .secure(properties.isCookieSecure())
            .sameSite(properties.getCookieSameSite())
            .path(properties.getCookiePath())
            .maxAge(maxAge)
            .build();
    }
}
