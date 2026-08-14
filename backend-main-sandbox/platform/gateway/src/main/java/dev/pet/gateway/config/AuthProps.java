package dev.pet.gateway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import java.util.List;

@ConfigurationProperties(prefix = "app")
@Validated
public class AuthProps {

    public static class Auth {
        private String baseUrl;
        private String exchangePath;
        private int connectTimeoutMs;
        private int readTimeoutMs;

        public String getBaseUrl() { return baseUrl; }
        public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

        public String getExchangePath() { return exchangePath; }
        public void setExchangePath(String exchangePath) { this.exchangePath = exchangePath; }

        public int getConnectTimeoutMs() { return connectTimeoutMs; }
        public void setConnectTimeoutMs(int connectTimeoutMs) { this.connectTimeoutMs = connectTimeoutMs; }

        public int getReadTimeoutMs() { return readTimeoutMs; }
        public void setReadTimeoutMs(int readTimeoutMs) { this.readTimeoutMs = readTimeoutMs; }
    }

    public static class Security {
        @NotEmpty
        private List<String> publicPaths;
        @NotEmpty
        private List<String> allowedOrigins;
        private List<String> trustedProxies = List.of();
        @NotBlank
        private String publicPrefix;

        public List<String> getPublicPaths() { return publicPaths; }
        public void setPublicPaths(List<String> publicPaths) { this.publicPaths = publicPaths; }
        public List<String> getAllowedOrigins() { return allowedOrigins; }
        public void setAllowedOrigins(List<String> allowedOrigins) { this.allowedOrigins = allowedOrigins; }
        public List<String> getTrustedProxies() { return trustedProxies; }
        public void setTrustedProxies(List<String> trustedProxies) { this.trustedProxies = trustedProxies; }
        public String getPublicPrefix() { return publicPrefix; }
        public void setPublicPrefix(String publicPrefix) { this.publicPrefix = publicPrefix; }
    }

    public static class RateLimit {
        @Positive
        private int replenishRate = 2;
        @Positive
        private int burstCapacity = 10;
        @Positive
        private int requestedTokens = 1;

        public int getReplenishRate() { return replenishRate; }
        public void setReplenishRate(int replenishRate) { this.replenishRate = replenishRate; }
        public int getBurstCapacity() { return burstCapacity; }
        public void setBurstCapacity(int burstCapacity) { this.burstCapacity = burstCapacity; }
        public int getRequestedTokens() { return requestedTokens; }
        public void setRequestedTokens(int requestedTokens) { this.requestedTokens = requestedTokens; }
    }

    @Valid
    private Auth auth = new Auth();
    @Valid
    private Security security = new Security();
    @Valid
    private RateLimit rateLimit = new RateLimit();

    public Auth getAuth() { return auth; }
    public Security getSecurity() { return security; }
    public RateLimit getRateLimit() { return rateLimit; }
}
