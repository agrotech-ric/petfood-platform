package dev.pet.pets.service;

import static org.assertj.core.api.Assertions.assertThat;

import dev.pet.pets.config.ShareProperties;
import dev.pet.pets.domain.ShareResourceType;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ShareTokenServiceTest {

    @Test
    void verifiesOnlyUntamperedVersionedTokensFromTheSameSecret() {
        UUID id = UUID.randomUUID();
        ShareTokenService service = service("0123456789abcdef0123456789abcdef");
        String token = service.createToken(id);

        assertThat(service.verify(token)).contains(id);
        assertThat(service.verify(token + "x")).isEmpty();
        assertThat(service.verify(token.replaceFirst("v1", "v2"))).isEmpty();
        assertThat(service.verify("malformed")).isEmpty();
        assertThat(service.verify(null)).isEmpty();
        assertThat(service("abcdef0123456789abcdef0123456789").verify(token)).isEmpty();
    }

    @Test
    void putsBearerTokenInFragmentAndUsesTheConfiguredSubpath() {
        ShareTokenService service = service("0123456789abcdef0123456789abcdef");
        String url = service.publicUrl(ShareResourceType.RECIPE, UUID.randomUUID());

        assertThat(url).startsWith("https://example.test/petfood/shared/recipe#v1.");
        assertThat(url).doesNotContain("?token=");
    }

    private ShareTokenService service(String secret) {
        ShareProperties properties = new ShareProperties();
        properties.setPublicBaseUrl("https://example.test/petfood");
        properties.setSigningSecret(secret);
        return new ShareTokenService(properties);
    }
}
