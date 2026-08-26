package dev.pet.pets.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.pet.pets.config.PdfReportProperties;
import dev.pet.pets.domain.Pet;
import dev.pet.pets.error.NotFoundException;
import dev.pet.pets.repo.PetContraindicationRepository;
import dev.pet.pets.repo.PetHealthRecordRepository;
import dev.pet.pets.repo.PetRepository;
import dev.pet.pets.repo.RecipeRepository;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.Base64;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

class PdfReportServiceTest {
    private PetRepository pets;
    private PetHealthRecordRepository health;
    private PetContraindicationRepository contraindications;
    private RecipeRepository recipes;
    private PetPhotoStorage photos;
    private PdfReportService service;

    @BeforeEach
    void setUp() {
        pets = mock(PetRepository.class);
        health = mock(PetHealthRecordRepository.class);
        contraindications = mock(PetContraindicationRepository.class);
        recipes = mock(RecipeRepository.class);
        photos = mock(PetPhotoStorage.class);
        PdfReportProperties properties = new PdfReportProperties();
        properties.setFontPath("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf");
        service = new PdfReportService(
            pets, recipes, health, contraindications, photos,
            mock(ResourceShareService.class), new ObjectMapper(), properties
        );
    }

    @Test
    void cropsPhotosFromTheCenterWithoutChangingTheirAspectRatio() {
        BufferedImage source = new BufferedImage(6, 2, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = source.createGraphics();
        graphics.setColor(Color.RED);
        graphics.fillRect(0, 0, 2, 2);
        graphics.setColor(Color.GREEN);
        graphics.fillRect(2, 0, 2, 2);
        graphics.setColor(Color.BLUE);
        graphics.fillRect(4, 0, 2, 2);
        graphics.dispose();

        BufferedImage cropped = PdfReportService.coverSquare(source, 1600);

        assertThat(cropped.getWidth()).isEqualTo(2);
        assertThat(cropped.getHeight()).isEqualTo(2);
        assertThat(new Color(cropped.getRGB(0, 0))).isEqualTo(Color.GREEN);
    }

    @AfterEach
    void closeRenderer() {
        service.closeRenderer();
    }

    @Test
    void generatesAReadableLocalizedPdfAndSanitizesFilename() {
        UUID owner = UUID.randomUUID();
        Pet pet = new Pet();
        pet.setId(UUID.randomUUID());
        pet.setOwnerId(owner);
        pet.setName("Ақтөс / тест");
        pet.setBirthDate(LocalDate.of(2022, 1, 1));
        pet.setWeightKg(12.5);
        pet.setComments("<script>alert('x')</script> описание");
        pet.setPhotoObjectKey("pets/test/photo.png");
        when(photos.read("pets/test/photo.png")).thenReturn(new StoredPhoto(
            Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="),
            "image/png"
        ));
        when(pets.findById(pet.getId())).thenReturn(Optional.of(pet));
        when(health.findByPetIdAndOwnerIdWithSymptoms(pet.getId(), owner)).thenReturn(List.of());
        when(contraindications.findByPetId(pet.getId())).thenReturn(Optional.empty());
        when(recipes.findByPet_IdAndOwnerIdAndStatusOrderByUpdatedAtDesc(pet.getId(), owner, "calculated"))
            .thenReturn(List.of());

        GeneratedPdf pdf = service.pet(jwt(owner), pet.getId(), "kz");

        assertThat(pdf.bytes()).startsWith('%', 'P', 'D', 'F').hasSizeGreaterThan(1_000);
        assertThat(pdf.filename()).endsWith(".pdf").doesNotContain("/").doesNotContain("\\");
    }

    @Test
    void doesNotExportAnotherOwnersPet() {
        UUID owner = UUID.randomUUID();
        Pet pet = new Pet();
        pet.setId(UUID.randomUUID());
        pet.setOwnerId(UUID.randomUUID());
        when(pets.findById(pet.getId())).thenReturn(Optional.of(pet));

        assertThatThrownBy(() -> service.pet(jwt(owner), pet.getId(), "ru"))
            .isInstanceOf(NotFoundException.class).hasMessage("Pet not found");
    }

    private Jwt jwt(UUID subject) {
        Instant now = Instant.now();
        return new Jwt("token", now, now.plusSeconds(60), Map.of("alg", "none"), Map.of("sub", subject.toString()));
    }
}
