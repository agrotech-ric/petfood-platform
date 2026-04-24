package dev.pet.gateway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app")
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
        private List<String> publicPaths;

        public List<String> getPublicPaths() { return publicPaths; }
        public void setPublicPaths(List<String> publicPaths) { this.publicPaths = publicPaths; }
    }

    private Auth auth = new Auth();
    private Security security = new Security();

    public Auth getAuth() { return auth; }
    public Security getSecurity() { return security; }
}
