package dev.pet.pets.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "app.photo-storage.type", havingValue = "fs")
public class LocalFsPetPhotoStorageService implements PetPhotoStorage {

    private final String baseUrl;
    private final Path rootDir;

    @Autowired
    public LocalFsPetPhotoStorageService(
        @Value("${app.photo-storage.base-url:}") String baseUrl,
        @Value("${app.photo-storage.fs.root-dir:/data/pets-photos}") String rootDir
    ) {
        this.baseUrl = baseUrl == null ? "" : baseUrl.trim();
        this.rootDir = Paths.get(rootDir).toAbsolutePath().normalize();
    }

    public LocalFsPetPhotoStorageService(String baseUrl) {
        this(baseUrl, "/data/pets-photos");
    }

    @Override
    public String buildObjectKey(UUID ownerId, String contentType) {
        String extension = "image/png".equalsIgnoreCase(contentType) ? ".png" : ".jpg";
        return "pets/" + ownerId + "/" + UUID.randomUUID() + extension;
    }

    @Override
    public String generateUploadUrl(String objectKey, String contentType) {
        UriComponentsBuilder b = baseUrl.isBlank()
            ? UriComponentsBuilder.newInstance()
            : UriComponentsBuilder.fromUriString(baseUrl);

        return b
            .path("/api/v1/pets/photos/upload")
            .queryParam("objectKey", objectKey)
            .build()
            .toUriString();
    }

    @Override
    public String generateDownloadUrl(String objectKey) {
        UriComponentsBuilder b = baseUrl.isBlank()
            ? UriComponentsBuilder.newInstance()
            : UriComponentsBuilder.fromUriString(baseUrl);

        return b
            .path("/api/v1/pets/photos/download")
            .queryParam("objectKey", objectKey)
            .build()
            .toUriString();
    }

    @Override
    public StoredPhoto read(String objectKey) {
        try {
            Path path = safePath(objectKey);
            if (!Files.isRegularFile(path)) throw new IllegalStateException("Pet photo is unavailable");
            byte[] bytes = Files.readAllBytes(path);
            if (bytes.length > 10L * 1024 * 1024) throw new IllegalStateException("Pet photo is too large");
            String contentType = Files.probeContentType(path);
            return new StoredPhoto(bytes, contentType == null ? "application/octet-stream" : contentType);
        } catch (IllegalStateException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("Pet photo is unavailable", ex);
        }
    }

    private Path safePath(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) throw new IllegalStateException("Pet photo is unavailable");
        Path path = rootDir.resolve(objectKey).normalize();
        if (!path.startsWith(rootDir)) throw new IllegalStateException("Pet photo is unavailable");
        return path;
    }
}
