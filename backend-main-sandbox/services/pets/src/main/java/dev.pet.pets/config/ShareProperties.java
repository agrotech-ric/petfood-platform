package dev.pet.pets.config;

import jakarta.annotation.PostConstruct;
import java.net.URI;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.sharing")
public class ShareProperties {
    private String publicBaseUrl;
    private String signingSecret;

    @PostConstruct
    void validate() {
        if (signingSecret == null || signingSecret.length() < 32) {
            throw new IllegalStateException("SHARE_TOKEN_SECRET must contain at least 32 characters");
        }
        try {
            URI uri = URI.create(publicBaseUrl);
            if (!uri.isAbsolute() || uri.getHost() == null || uri.getFragment() != null || uri.getQuery() != null
                || !("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))) {
                throw new IllegalArgumentException();
            }
            publicBaseUrl = publicBaseUrl.replaceAll("/+$", "");
        } catch (RuntimeException ex) {
            throw new IllegalStateException("PETFOOD_PUBLIC_URL must be an absolute HTTP(S) URL", ex);
        }
    }

    public String getPublicBaseUrl() { return publicBaseUrl; }
    public void setPublicBaseUrl(String publicBaseUrl) { this.publicBaseUrl = publicBaseUrl; }
    public String getSigningSecret() { return signingSecret; }
    public void setSigningSecret(String signingSecret) { this.signingSecret = signingSecret; }
}
