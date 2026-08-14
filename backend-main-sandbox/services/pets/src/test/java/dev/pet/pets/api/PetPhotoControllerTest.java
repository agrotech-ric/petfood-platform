package dev.pet.pets.api;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.oauth2.jwt.Jwt;

import java.nio.file.Path;
import java.nio.file.Files;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class PetPhotoControllerTest {
    @TempDir
    Path root;

    @Test
    void ownerCanUploadAndDownloadPrivatePhoto() {
        UUID owner = UUID.randomUUID();
        String key = "pets/" + owner + "/photo.png";
        PetPhotoController controller = new PetPhotoController(root.toString());
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setContentType("image/png");
        request.setContent(new byte[] {1, 2, 3});

        assertThat(controller.upload(key, jwt(owner), request).getStatusCode()).isEqualTo(HttpStatus.OK);
        var download = controller.download(key, jwt(owner));
        assertThat(download.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(download.getHeaders().getCacheControl()).isEqualTo("private, no-store");
        assertThat(download.getBody()).containsExactly(1, 2, 3);
    }

    @Test
    void foreignOwnerGetsUniformNotFoundAndInvalidTypeIsRejected() {
        UUID owner = UUID.randomUUID();
        UUID caller = UUID.randomUUID();
        String key = "pets/" + owner + "/photo.jpg";
        PetPhotoController controller = new PetPhotoController(root.toString());
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setContentType("text/plain");
        request.setContent(new byte[] {1});

        assertThat(controller.upload(key, jwt(owner), request).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        request.setContentType("image/jpeg");
        assertThat(controller.upload(key, jwt(caller), request).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(controller.download(key, jwt(caller)).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void rejectsOwnerPrefixTraversalAndOversizedUpload() {
        UUID owner = UUID.randomUUID();
        PetPhotoController controller = new PetPhotoController(root.toString());
        MockHttpServletRequest oversized = new MockHttpServletRequest();
        oversized.setContentType("image/jpeg");
        oversized.setContent(new byte[10 * 1024 * 1024 + 1]);

        assertThat(controller.upload("pets/" + owner + "/too-large.jpg", jwt(owner), oversized).getStatusCode())
            .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(controller.download("pets/" + owner + "/../other/photo.jpg", jwt(owner)).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void readsLegacyOwnerKeyAndHidesItFromUnauthenticatedCaller() throws Exception {
        UUID owner = UUID.randomUUID();
        String key = "pets/" + owner + "/legacy-photo.jpg";
        Path file = root.resolve(key);
        Files.createDirectories(file.getParent());
        Files.write(file, new byte[] {4, 5});
        PetPhotoController controller = new PetPhotoController(root.toString());

        assertThat(controller.download(key, jwt(owner)).getBody()).containsExactly(4, 5);
        assertThat(controller.download(key, null).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    private Jwt jwt(UUID owner) {
        return new Jwt("token", Instant.now(), Instant.now().plusSeconds(60),
            Map.of("alg", "none"), Map.of("sub", owner.toString()));
    }
}
