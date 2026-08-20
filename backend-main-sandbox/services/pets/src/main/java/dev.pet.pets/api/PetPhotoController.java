package dev.pet.pets.api;

import dev.pet.pets.error.NotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

import java.io.InputStream;
import java.nio.file.*;

@RestController
@RequestMapping("/api/v1/pets/photos")
@ConditionalOnProperty(name = "app.photo-storage.type", havingValue = "fs")
public class PetPhotoController {

    private static final long MAX_PHOTO_BYTES = 10L * 1024 * 1024;

    private final Path rootDir;

    public PetPhotoController(
        @Value("${app.photo-storage.fs.root-dir:/data/pets-photos}") String rootDir
    ) {
        this.rootDir = Paths.get(rootDir).toAbsolutePath().normalize();
    }

    @PutMapping("/upload")
    public ResponseEntity<Void> upload(
        @RequestParam("objectKey") String objectKey,
        @AuthenticationPrincipal Jwt jwt,
        HttpServletRequest request
    ) {
        try {
            Path target = resolveOwned(objectKey, jwt);
            String contentType = request.getContentType();
            if (!isAcceptedContentType(contentType) || request.getContentLengthLong() > MAX_PHOTO_BYTES) {
                return ResponseEntity.badRequest().build();
            }
            Files.createDirectories(target.getParent());

            try (InputStream in = request.getInputStream()) {
                byte[] bytes = in.readNBytes((int) MAX_PHOTO_BYTES + 1);
                if (bytes.length > MAX_PHOTO_BYTES) {
                    return ResponseEntity.badRequest().build();
                }
                Files.write(target, bytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            }
            return ResponseEntity.ok().build();
        } catch (NotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/download")
    public ResponseEntity<byte[]> download(
        @RequestParam("objectKey") String objectKey,
        @AuthenticationPrincipal Jwt jwt
    ) {
        try {
            Path target = resolveOwned(objectKey, jwt);
            if (!Files.exists(target) || !Files.isRegularFile(target)) {
                throw new NotFoundException("photo not found");
            }

            byte[] bytes = Files.readAllBytes(target);
            String ct = Files.probeContentType(target);
            if (ct == null || ct.isBlank()) ct = MediaType.APPLICATION_OCTET_STREAM_VALUE;

            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, ct)
                .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
                .body(bytes);
        } catch (NotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private Path resolveSafe(String objectKey) {
        if (objectKey == null) throw new IllegalArgumentException("objectKey is required");
        String cleaned = objectKey.trim();
        if (cleaned.isEmpty()) throw new IllegalArgumentException("objectKey is empty");

        Path resolved = rootDir.resolve(cleaned).normalize();
        if (!resolved.startsWith(rootDir)) {
            throw new IllegalArgumentException("invalid objectKey");
        }
        return resolved;
    }

    private Path resolveOwned(String objectKey, Jwt jwt) {
        if (jwt == null || objectKey == null || !objectKey.startsWith("pets/" + jwt.getSubject() + "/")) {
            throw new NotFoundException("photo not found");
        }
        Path resolved = resolveSafe(objectKey);
        Path ownerDir = rootDir.resolve("pets").resolve(jwt.getSubject()).normalize();
        if (!resolved.startsWith(ownerDir)) {
            throw new NotFoundException("photo not found");
        }
        return resolved;
    }

    private boolean isAcceptedContentType(String contentType) {
        return "image/jpeg".equalsIgnoreCase(contentType) || "image/png".equalsIgnoreCase(contentType);
    }
}
