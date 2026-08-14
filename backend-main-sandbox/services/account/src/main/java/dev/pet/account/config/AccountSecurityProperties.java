package dev.pet.account.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@Validated
@ConfigurationProperties(prefix = "app.security")
public class AccountSecurityProperties {
    private boolean cookieSecure = true;
    @NotBlank
    private String cookiePath = "/petfood";
    @NotBlank
    private String cookieSameSite = "Lax";
    private Duration sessionTtl = Duration.ofDays(7);
    private Duration otpTtl = Duration.ofMinutes(10);
    private Duration otpCooldown = Duration.ofMinutes(1);
    @Min(1)
    private int otpMaxAttempts = 5;
    @NotBlank
    private String rateLimitPepper;

    public boolean isCookieSecure() { return cookieSecure; }
    public void setCookieSecure(boolean cookieSecure) { this.cookieSecure = cookieSecure; }
    public String getCookiePath() { return cookiePath; }
    public void setCookiePath(String cookiePath) { this.cookiePath = cookiePath; }
    public String getCookieSameSite() { return cookieSameSite; }
    public void setCookieSameSite(String cookieSameSite) { this.cookieSameSite = cookieSameSite; }
    public Duration getSessionTtl() { return sessionTtl; }
    public void setSessionTtl(Duration sessionTtl) { this.sessionTtl = sessionTtl; }
    public Duration getOtpTtl() { return otpTtl; }
    public void setOtpTtl(Duration otpTtl) { this.otpTtl = otpTtl; }
    public Duration getOtpCooldown() { return otpCooldown; }
    public void setOtpCooldown(Duration otpCooldown) { this.otpCooldown = otpCooldown; }
    public int getOtpMaxAttempts() { return otpMaxAttempts; }
    public void setOtpMaxAttempts(int otpMaxAttempts) { this.otpMaxAttempts = otpMaxAttempts; }
    public String getRateLimitPepper() { return rateLimitPepper; }
    public void setRateLimitPepper(String rateLimitPepper) { this.rateLimitPepper = rateLimitPepper; }
}
