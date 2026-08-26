package dev.pet.pets.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.pet.pets.domain.Pet;
import dev.pet.pets.domain.PetContraindication;
import dev.pet.pets.domain.PetHealthRecord;
import dev.pet.pets.domain.Recipe;
import dev.pet.pets.domain.ResourceShare;
import dev.pet.pets.domain.ShareResourceType;
import dev.pet.pets.dto.PublicPetProfileResponse;
import dev.pet.pets.dto.PublicRecipeResponse;
import dev.pet.pets.error.NotFoundException;
import dev.pet.pets.repo.PetContraindicationRepository;
import dev.pet.pets.repo.PetHealthRecordRepository;
import dev.pet.pets.repo.RecipeRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PublicShareService {
    private static final Set<String> PUBLIC_CALCULATION_KEYS = Set.of(
        "calories", "dailyNorm", "dailyCaloriesNorm", "composition", "nutrition",
        "nutritionPer100", "nutrients", "minerals", "vitamins", "digestion"
    );

    private final ResourceShareService shareService;
    private final PetHealthRecordRepository healthRepository;
    private final PetContraindicationRepository contraindicationRepository;
    private final RecipeRepository recipeRepository;
    private final PetPhotoStorage photoStorage;
    private final ObjectMapper objectMapper;

    public PublicShareService(
        ResourceShareService shareService,
        PetHealthRecordRepository healthRepository,
        PetContraindicationRepository contraindicationRepository,
        RecipeRepository recipeRepository,
        PetPhotoStorage photoStorage,
        ObjectMapper objectMapper
    ) {
        this.shareService = shareService;
        this.healthRepository = healthRepository;
        this.contraindicationRepository = contraindicationRepository;
        this.recipeRepository = recipeRepository;
        this.photoStorage = photoStorage;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public PublicPetProfileResponse pet(String token) {
        ResourceShare share = shareService.resolvePublic(token, ShareResourceType.PET);
        Pet pet = share.getPet();
        List<PetHealthRecord> records = new ArrayList<>(
            healthRepository.findByPetIdAndOwnerIdWithSymptoms(pet.getId(), pet.getOwnerId())
        );
        records.sort(Comparator.comparing(PetHealthRecord::getRecordDate, Comparator.nullsLast(Comparator.naturalOrder())));
        PublicPetProfileResponse.Contraindications contraindications = contraindicationRepository.findByPetId(pet.getId())
            .map(this::contraindications)
            .orElseGet(() -> new PublicPetProfileResponse.Contraindications(List.of(), ""));
        List<PublicPetProfileResponse.RecipeSummary> recipes = recipeRepository
            .findByPet_IdAndOwnerIdAndStatusOrderByUpdatedAtDesc(pet.getId(), pet.getOwnerId(), "calculated")
            .stream()
            .filter(shareService::isCalculated)
            .map(this::recipeSummary)
            .toList();
        return new PublicPetProfileResponse(
            new PublicPetProfileResponse.PetDetails(
                pet.getName(),
                pet.getSpecies() == null ? null : pet.getSpecies().getName(),
                pet.getBreed() == null ? null : pet.getBreed().getName(),
                pet.getGender() == null ? null : pet.getGender().name(),
                pet.getColor() == null ? null : pet.getColor().getName(),
                pet.getBirthDate(),
                pet.getWeightKg(),
                pet.getReproductiveStatus() == null ? null : pet.getReproductiveStatus().getName(),
                pet.getReproductiveSubStatus() == null ? null : pet.getReproductiveSubStatus().getName(),
                pet.getPuppiesCount(),
                pet.getComments(),
                hasPhoto(pet),
                pet.getUpdatedAt()
            ),
            records.stream().map(this::healthEntry).toList(),
            contraindications,
            recipes
        );
    }

    @Transactional(readOnly = true)
    public PublicRecipeResponse recipe(String token) {
        Recipe recipe = shareService.resolvePublic(token, ShareResourceType.RECIPE).getRecipe();
        Pet pet = recipe.getPet();
        return new PublicRecipeResponse(
            recipe.getName(),
            recipe.getDescription(),
            recipe.getAgeCategory(),
            recipe.getBreedSize(),
            recipe.getTargetWeightKg(),
            recipe.getTargetBreed() == null ? null : recipe.getTargetBreed().getName(),
            recipe.getTargetAgeMonths(),
            recipe.getTargetGender(),
            recipe.getTargetActivityType() == null ? null : recipe.getTargetActivityType().getName(),
            recipe.getTargetReproductiveStatus() == null ? null : recipe.getTargetReproductiveStatus().getName(),
            recipe.getTargetHealthCondition() == null ? null : recipe.getTargetHealthCondition().getNameRu(),
            recipe.getTargetDisorder(),
            recipe.getTargetSymptoms().stream().map(item -> item.getName()).toList(),
            recipe.getTargetEnergyKcal(),
            recipe.getMaximizeNutrients(),
            recipe.getIngredients().stream().map(item -> new PublicRecipeResponse.IngredientItem(
                item.getIngredient().getName(), item.getIngredient().getSubtype(), item.getIngredient().getCategory(),
                item.getMinPercent(), item.getMaxPercent(), item.getResultPercent(), item.getResultGrams()
            )).toList(),
            recipe.getNutrientConstraints().stream().map(item -> new PublicRecipeResponse.NutrientConstraintItem(
                item.getNutrientKey(), item.getMinValue(), item.getMaxValue()
            )).toList(),
            publicCalculation(recipe.getCalculationResult()),
            recipe.getCalculationVersion(),
            recipe.getCalculatedAt(),
            pet == null ? null : new PublicRecipeResponse.LinkedPet(
                pet.getName(),
                pet.getSpecies() == null ? null : pet.getSpecies().getName(),
                pet.getBreed() == null ? null : pet.getBreed().getName(),
                pet.getBirthDate(),
                pet.getWeightKg(),
                hasPhoto(pet)
            )
        );
    }

    @Transactional(readOnly = true)
    public StoredPhoto petPhoto(String token) {
        Pet pet = shareService.resolvePublic(token, ShareResourceType.PET).getPet();
        return readPhoto(pet);
    }

    @Transactional(readOnly = true)
    public StoredPhoto recipePetPhoto(String token) {
        Recipe recipe = shareService.resolvePublic(token, ShareResourceType.RECIPE).getRecipe();
        if (recipe.getPet() == null) throw publicNotFound();
        return readPhoto(recipe.getPet());
    }

    private StoredPhoto readPhoto(Pet pet) {
        if (!hasPhoto(pet)) throw publicNotFound();
        try {
            return photoStorage.read(pet.getPhotoObjectKey());
        } catch (RuntimeException ex) {
            throw publicNotFound();
        }
    }

    private PublicPetProfileResponse.HealthEntry healthEntry(PetHealthRecord record) {
        return new PublicPetProfileResponse.HealthEntry(
            record.getRecordDate(),
            record.getConditionName(),
            record.getConditionStatus(),
            record.getActivityType() == null ? null : record.getActivityType().getName(),
            record.getSymptoms() == null ? List.of() : record.getSymptoms().stream().map(item -> item.getName()).sorted().toList(),
            record.getNotes(),
            record.getWeightKg(),
            record.getActivityHours()
        );
    }

    private PublicPetProfileResponse.Contraindications contraindications(PetContraindication value) {
        try {
            List<String> ingredients = objectMapper.readValue(
                value.getIngredientsJson(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
            );
            return new PublicPetProfileResponse.Contraindications(
                ingredients,
                value.getDescription() == null ? "" : value.getDescription()
            );
        } catch (Exception ex) {
            return new PublicPetProfileResponse.Contraindications(List.of(), value.getDescription());
        }
    }

    private PublicPetProfileResponse.RecipeSummary recipeSummary(Recipe recipe) {
        JsonNode calories = recipe.getCalculationResult().path("calories");
        return new PublicPetProfileResponse.RecipeSummary(
            recipe.getName(), recipe.getDescription(), recipe.getAgeCategory(), recipe.getBreedSize(),
            calories.isNumber() ? calories.asDouble() : null, recipe.getCalculatedAt()
        );
    }

    private JsonNode publicCalculation(JsonNode source) {
        ObjectNode result = objectMapper.createObjectNode();
        if (source == null || !source.isObject()) return result;
        PUBLIC_CALCULATION_KEYS.forEach(key -> {
            JsonNode value = source.get(key);
            if (value != null) result.set(key, scrub(value));
        });
        return result;
    }

    private JsonNode scrub(JsonNode source) {
        if (source.isObject()) {
            ObjectNode result = objectMapper.createObjectNode();
            source.fields().forEachRemaining(entry -> {
                String normalized = entry.getKey().toLowerCase();
                if (!normalized.endsWith("id") && !normalized.contains("owner")
                    && !normalized.contains("passport") && !normalized.contains("objectkey")
                    && !normalized.endsWith("url")) {
                    result.set(entry.getKey(), scrub(entry.getValue()));
                }
            });
            return result;
        }
        if (source.isArray()) {
            var result = objectMapper.createArrayNode();
            source.forEach(item -> result.add(scrub(item)));
            return result;
        }
        return source.deepCopy();
    }

    private boolean hasPhoto(Pet pet) {
        return pet.getPhotoObjectKey() != null && !pet.getPhotoObjectKey().isBlank();
    }

    private NotFoundException publicNotFound() {
        return new NotFoundException("Shared resource not found");
    }
}
