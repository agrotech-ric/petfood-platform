package dev.pet.account.service;

import dev.pet.account.config.AccountSecurityProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class OtpGuardTest {
    private StringRedisTemplate redis;
    private ValueOperations<String, String> values;
    private OtpGuard guard;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        redis = mock(StringRedisTemplate.class);
        values = mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(values);
        AccountSecurityProperties properties = new AccountSecurityProperties();
        properties.setRateLimitPepper("CANARY_IDENTITY_PEPPER");
        properties.setOtpMaxAttempts(2);
        guard = new OtpGuard(redis, properties);
    }

    @Test
    void rejectsIssuanceDuringCooldownWithoutUsingPlainIdentityAsKey() {
        when(values.setIfAbsent(anyString(), eq("1"), any(Duration.class))).thenReturn(false);

        assertThatThrownBy(() -> guard.acquireIssuePermit("login", "canary@example.test"))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("429");
        verify(values).setIfAbsent(argThat(key -> !key.contains("canary@example.test")), eq("1"), any(Duration.class));
    }

    @Test
    void invalidatesCodeAfterConfiguredFailedAttempts() {
        when(values.increment(anyString())).thenReturn(2L);

        assertThatThrownBy(() -> guard.recordFailedAttempt("login", "canary@example.test", "code-key"))
            .isInstanceOf(ResponseStatusException.class);
        verify(redis).delete("code-key");
    }

    @Test
    void usesTheSameHashedKeyAcrossSourcesAndAllowsIssuanceAfterCooldownExpires() {
        when(values.setIfAbsent(anyString(), eq("1"), any(Duration.class)))
            .thenReturn(true, false, true);

        guard.acquireIssuePermit("login", "canary@example.test");
        assertThatThrownBy(() -> guard.acquireIssuePermit("login", "canary@example.test"))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("429");
        guard.acquireIssuePermit("login", "canary@example.test");

        var keyCaptor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(values, times(3)).setIfAbsent(keyCaptor.capture(), eq("1"), eq(Duration.ofMinutes(1)));
        org.assertj.core.api.Assertions.assertThat(keyCaptor.getAllValues()).containsOnly(keyCaptor.getValue());
        org.assertj.core.api.Assertions.assertThat(keyCaptor.getValue()).doesNotContain("canary@example.test");
    }

    @Test
    void clearsAttemptStateAfterSuccessfulVerification() {
        guard.clear("login", "canary@example.test");

        verify(redis).delete(org.mockito.ArgumentMatchers.<String>argThat(
            key -> key.endsWith(":attempts") && !key.contains("canary@example.test")
        ));
    }
}
