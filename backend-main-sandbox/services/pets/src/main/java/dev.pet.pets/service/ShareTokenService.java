package dev.pet.pets.service;

import dev.pet.pets.config.ShareProperties;
import dev.pet.pets.domain.ShareResourceType;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

@Service
public class ShareTokenService {
    private static final String VERSION = "v1";
    private static final String ALGORITHM = "HmacSHA256";

    private final byte[] signingKey;
    private final String publicBaseUrl;

    public ShareTokenService(ShareProperties properties) {
        this.signingKey = properties.getSigningSecret().getBytes(StandardCharsets.UTF_8);
        this.publicBaseUrl = properties.getPublicBaseUrl();
    }

    public String createToken(UUID shareId) {
        String identifier = shareId.toString();
        return VERSION + "." + identifier + "." + encode(sign(VERSION + ":" + identifier));
    }

    public Optional<UUID> verify(String token) {
        if (token == null || token.isBlank() || token.length() > 256) return Optional.empty();
        String[] parts = token.split("\\.", -1);
        if (parts.length != 3 || !VERSION.equals(parts[0])) return Optional.empty();
        try {
            UUID id = UUID.fromString(parts[1]);
            byte[] supplied = Base64.getUrlDecoder().decode(parts[2]);
            byte[] expected = sign(VERSION + ":" + parts[1]);
            return MessageDigest.isEqual(expected, supplied) ? Optional.of(id) : Optional.empty();
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    public String publicUrl(ShareResourceType type, UUID shareId) {
        String route = type == ShareResourceType.PET ? "/shared/pet" : "/shared/recipe";
        return publicBaseUrl + route + "#" + createToken(shareId);
    }

    private byte[] sign(String value) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(new SecretKeySpec(signingKey, ALGORITHM));
            return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            throw new IllegalStateException("Share token signing is unavailable", ex);
        }
    }

    private String encode(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
