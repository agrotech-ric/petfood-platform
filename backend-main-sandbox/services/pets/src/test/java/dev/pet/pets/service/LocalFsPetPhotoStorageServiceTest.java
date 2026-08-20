package dev.pet.pets.service;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class LocalFsPetPhotoStorageServiceTest {
    @Test
    void generatesOwnerScopedKeyFromMediaTypeOnly() {
        UUID owner = UUID.randomUUID();
        LocalFsPetPhotoStorageService storage = new LocalFsPetPhotoStorageService("");

        String key = storage.buildObjectKey(owner, "image/png");

        assertThat(key).startsWith("pets/" + owner + "/").endsWith(".png");
        assertThat(key).doesNotContain("..").doesNotContain("\\");
    }
}
