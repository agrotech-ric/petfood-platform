package dev.pet.pets.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.pet.pets.config.PdfReportProperties;
import dev.pet.pets.domain.Breed;
import dev.pet.pets.domain.Gender;
import dev.pet.pets.domain.Pet;
import dev.pet.pets.domain.PetContraindication;
import dev.pet.pets.domain.Recipe;
import dev.pet.pets.domain.Symptom;
import dev.pet.pets.error.BadRequestException;
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
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.Base64;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
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
    private ResourceShareService shares;
    private ObjectMapper objectMapper;
    private PdfReportService service;

    @BeforeEach
    void setUp() {
        pets = mock(PetRepository.class);
        health = mock(PetHealthRecordRepository.class);
        contraindications = mock(PetContraindicationRepository.class);
        recipes = mock(RecipeRepository.class);
        photos = mock(PetPhotoStorage.class);
        shares = mock(ResourceShareService.class);
        objectMapper = new ObjectMapper();
        PdfReportProperties properties = new PdfReportProperties();
        properties.setFontPath("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf");
        service = new PdfReportService(
            pets, recipes, health, contraindications, photos,
            shares, objectMapper, properties
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

    @Test
    void rendersCalculatedRecipeAsThreePageVeterinaryPrescription() throws Exception {
        UUID owner = UUID.randomUUID();
        Recipe recipe = referenceRecipe(owner);
        PetContraindication contraindication = new PetContraindication();
        contraindication.setPetId(recipe.getPet().getId());
        contraindication.setOwnerId(owner);
        contraindication.setIngredientsJson("[\"Курица-грудка\",\"Индейка-грудка\"]");
        when(recipes.findById(42L)).thenReturn(Optional.of(recipe));
        when(shares.isCalculated(recipe)).thenReturn(true);
        when(contraindications.findByPetId(recipe.getPet().getId())).thenReturn(Optional.of(contraindication));

        GeneratedPdf pdf = service.recipe(jwt(owner), 42L, "ru");

        assertThat(pdf.bytes()).startsWith('%', 'P', 'D', 'F').hasSizeGreaterThan(10_000);
        try (PDDocument document = Loader.loadPDF(pdf.bytes())) {
            assertThat(document.getNumberOfPages()).isEqualTo(3);
            String text = new PDFTextStripper().getText(document);
            assertThat(text)
                .contains("ВЕТЕРИНАРНЫЙ РЕЦЕПТ НА КОРМ")
                .contains("Суточная потребность калорий")
                .contains("4 471")
                .contains("Курица-грудка")
                .contains("Содержание нутриентов в суточной дозе")
                .contains("Рекомендации по применению")
                .contains("ФИО владельца")
                .contains("ФИО ветеринара")
                .doesNotContain("#");
        }
    }

    @Test
    void localizesPrescriptionAndKeepsUnsupportedInstructionsUnavailable() throws Exception {
        UUID owner = UUID.randomUUID();
        Recipe recipe = referenceRecipe(owner);
        when(recipes.findById(42L)).thenReturn(Optional.of(recipe));
        when(shares.isCalculated(recipe)).thenReturn(true);
        when(contraindications.findByPetId(recipe.getPet().getId())).thenReturn(Optional.empty());

        GeneratedPdf pdf = service.recipe(jwt(owner), 42L, "kz");

        try (PDDocument document = Loader.loadPDF(pdf.bytes())) {
            String text = new PDFTextStripper().getText(document);
            assertThat(text)
                .contains("ЖЕМГЕ АРНАЛҒАН ВЕТЕРИНАРИЯЛЫҚ РЕЦЕПТ")
                .contains("Қолдану жөніндегі ұсынымдар")
                .contains("Азықтандыру тәртібі")
                .contains("—");
        }
    }

    @Test
    void rejectsDraftAndAnotherOwnersRecipe() throws Exception {
        UUID owner = UUID.randomUUID();
        Recipe recipe = referenceRecipe(owner);
        when(recipes.findById(42L)).thenReturn(Optional.of(recipe));

        assertThatThrownBy(() -> service.recipe(jwt(UUID.randomUUID()), 42L, "ru"))
            .isInstanceOf(NotFoundException.class).hasMessage("Recipe not found");

        when(shares.isCalculated(recipe)).thenReturn(false);
        assertThatThrownBy(() -> service.recipe(jwt(owner), 42L, "ru"))
            .isInstanceOf(BadRequestException.class)
            .hasMessage("Only a fully calculated recipe can be exported");
    }

    @Test
    void letsLongPrescriptionContentFlowWithoutClippingTheFinalSection() throws Exception {
        UUID owner = UUID.randomUUID();
        Recipe recipe = referenceRecipe(owner);
        recipe.setDescription("Длинное описание рациона. ".repeat(80));
        when(recipes.findById(42L)).thenReturn(Optional.of(recipe));
        when(shares.isCalculated(recipe)).thenReturn(true);
        when(contraindications.findByPetId(recipe.getPet().getId())).thenReturn(Optional.empty());

        GeneratedPdf pdf = service.recipe(jwt(owner), 42L, "ru");

        try (PDDocument document = Loader.loadPDF(pdf.bytes())) {
            assertThat(document.getNumberOfPages()).isGreaterThanOrEqualTo(3);
            assertThat(new PDFTextStripper().getText(document)).contains("ФИО ветеринара");
        }
    }

    private Recipe referenceRecipe(UUID owner) throws Exception {
        Pet pet = new Pet();
        pet.setId(UUID.randomUUID());
        pet.setOwnerId(owner);
        pet.setName("Белка");
        pet.setBirthDate(LocalDate.of(2023, 3, 12));
        pet.setWeightKg(25.0);
        pet.setGender(Gender.female);
        Breed breed = new Breed();
        breed.setNameRu("Далматинец");
        breed.setNameEn("Dalmatian");
        pet.setBreed(breed);

        Symptom symptom = new Symptom();
        symptom.setName("Вялость, Кашель");
        Recipe recipe = new Recipe();
        recipe.setOwnerId(owner);
        recipe.setPet(pet);
        recipe.setName("Корм для беременных");
        recipe.setDescription("Корм рассчитанный для беременных и кормящих с 5 и более щенками, насыщен быстроусвояемыми белками.");
        recipe.setAgeCategory("adults");
        recipe.setBreedSize("large");
        recipe.setTargetGender("female");
        recipe.setTargetDisorder("Уход за взрослыми");
        recipe.setTargetSymptoms(Set.of(symptom));
        recipe.setStatus("calculated");
        recipe.setCalculatedAt(OffsetDateTime.parse("2026-09-12T10:00:00+05:00"));
        recipe.setCalculationResult(objectMapper.readTree("""
            {
              "calories": 118,
              "dailyNorm": 3797,
              "dailyCaloriesNorm": 4471,
              "composition": [
                {"label":"Вода — Обыкновенный","percent":3,"grams":114},
                {"label":"Спаржа — Обыкновенный","percent":3,"grams":114},
                {"label":"Рис — Белый, Круглозерный (Короткозерный)","percent":16.77,"grams":637},
                {"label":"Рыбий жир — Печень трески","percent":1.23,"grams":47},
                {"label":"Животный жир — Бараний","percent":1,"grams":38},
                {"label":"Утятина — Печень","percent":50,"grams":1899},
                {"label":"Фрукты — Яблоки","percent":25,"grams":949}
              ],
              "nutrition": [
                {"label":"Влага","value":73,"unit":"g"},
                {"label":"Белки","value":15,"unit":"g"},
                {"label":"Углеводы","value":7,"unit":"g"},
                {"label":"Жиры","value":5,"unit":"g"}
              ],
              "minerals": [
                {"label":"Кальций","current":8.91,"unit":"mg"},
                {"label":"Фосфор","current":121.41,"unit":"mg"},
                {"label":"Магний","current":28.35,"unit":"mg"},
                {"label":"Натрий","current":54.09,"unit":"mg"},
                {"label":"Калий","current":251.84,"unit":"mg"},
                {"label":"Железо","current":0.74,"unit":"mg"},
                {"label":"Медь","current":0.06,"unit":"mg"},
                {"label":"Цинк","current":0.96,"unit":"mg"},
                {"label":"Марганец","current":0.11,"unit":"mg"},
                {"label":"Селен","current":8.13,"unit":"µg"},
                {"label":"Йод","current":1.11,"unit":"µg"}
              ],
              "vitamins": [
                {"label":"Витамин A","current":15.01,"unit":"µg"},
                {"label":"Витамин E","current":0.21,"unit":"mg"},
                {"label":"Витамин Д","current":0.15,"unit":"µg"},
                {"label":"Витамин B1 (тиамин)","current":0.11,"unit":"mg"},
                {"label":"Витамин B2 (рибофлавин)","current":0.1,"unit":"mg"},
                {"label":"Витамин B3 (ниацин)","current":4.66,"unit":"mg"},
                {"label":"Пантотеновая кислота","current":0.8,"unit":"mg"},
                {"label":"Витамин B6","current":0.24,"unit":"mg"},
                {"label":"Фолиевая кислота","current":0.0,"unit":"mg"},
                {"label":"Витамин B12","current":0.18,"unit":"µg"},
                {"label":"Витамин C","current":4.17,"unit":"mg"},
                {"label":"Витамин K","current":1.07,"unit":"µg"}
              ],
              "nutrients": [
                {"label":"Зола","value":29.3,"unit":"g"},
                {"label":"Клетчатка","value":25.44,"unit":"g"},
                {"label":"Холестерин","value":1478.68,"unit":"mg"},
                {"label":"Сахар общее","value":98.64,"unit":"g"},
                {"label":"Холин","value":1933.21,"unit":"mg"},
                {"label":"Линолевая кислота","value":13.57,"unit":"g"},
                {"label":"Альфа-линоленовая кислота","value":0.65,"unit":"g"},
                {"label":"Арахидоновая кислота","value":1.75,"unit":"g"},
                {"label":"Эйкозапентаеновая кислота (ЭПК)","value":0,"unit":"g"},
                {"label":"Докозагексаеновая кислота (ДГК)","value":0,"unit":"g"}
              ]
            }
            """));
        return recipe;
    }

    private Jwt jwt(UUID subject) {
        Instant now = Instant.now();
        return new Jwt("token", now, now.plusSeconds(60), Map.of("alg", "none"), Map.of("sub", subject.toString()));
    }
}
