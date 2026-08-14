package dev.pet.account.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SessionCookieFactoryTest {
    @Test
    void createsSecureProductionCookieWithoutExposingValueInAttributes() {
        AccountSecurityProperties properties = new AccountSecurityProperties();
        properties.setRateLimitPepper("test-pepper");
        SessionCookieFactory factory = new SessionCookieFactory(properties);

        String cookie = factory.create("CANARY_SID_NEVER_LOG").toString();

        assertThat(cookie).contains("sid=CANARY_SID_NEVER_LOG", "Path=/petfood", "Secure", "HttpOnly", "SameSite=Lax");
    }

    @Test
    void createsRootScopedLocalHttpCookie() {
        AccountSecurityProperties properties = new AccountSecurityProperties();
        properties.setCookieSecure(false);
        properties.setCookiePath("/");
        properties.setRateLimitPepper("test-pepper");

        String cookie = new SessionCookieFactory(properties).create("sid").toString();

        assertThat(cookie).contains("Path=/", "HttpOnly", "SameSite=Lax").doesNotContain("Secure");
    }
}
