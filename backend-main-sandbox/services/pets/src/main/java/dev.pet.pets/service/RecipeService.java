package dev.pet.pets.service;

import dev.pet.pets.domain.*;
import dev.pet.pets.dto.*;
import dev.pet.pets.error.BadRequestException;
import dev.pet.pets.error.ForbiddenOperationException;
import dev.pet.pets.error.NotFoundException;
import dev.pet.pets.repo.*;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecipeService {

    private static final Set<String> SORTABLE_FIELDS = Set.of(
        "name", "type", "format", "ageCategory", "breedSize", "status", "createdAt", "updatedAt"
    );
    private static final Set<String> NUTRIENT_KEYS = Set.of(
        "calories", "protein", "fat", "carbs", "moisture", "fiber", "ash", "cholesterol", "sugar",
        "calcium", "phosphorus", "magnesium", "sodium", "potassium", "iron", "copper", "zinc",
        "manganese", "linoleic", "alphaLinolenic", "arachidonic", "epa", "dha", "choline",
        "selenium", "iodine", "vitaminA", "vitaminE", "vitaminD", "vitaminB1", "vitaminB2",
        "vitaminB3", "vitaminB5", "vitaminB6", "vitaminB9", "vitaminB12", "vitaminC", "vitaminK",
        "alphaCarotene", "betaCarotene", "betaCryptoxanthin", "luteinZeaxanthin", "lycopene", "retinol"
    );

    private final RecipeRepository recipeRepository;
    private final PetRepository petRepository;
    private final IngredientRepository ingredientRepository;
    private final BreedRepository breedRepository;
    private final ActivityTypeRepository activityTypeRepository;
    private final ReproductiveStatusRepository reproductiveStatusRepository;
    private final HealthConditionRepository healthConditionRepository;
    private final SymptomRepository symptomRepository;

    public RecipeService(
        RecipeRepository recipeRepository,
        PetRepository petRepository,
        IngredientRepository ingredientRepository,
        BreedRepository breedRepository,
        ActivityTypeRepository activityTypeRepository,
        ReproductiveStatusRepository reproductiveStatusRepository,
        HealthConditionRepository healthConditionRepository,
        SymptomRepository symptomRepository
    ) {
        this.recipeRepository = recipeRepository;
        this.petRepository = petRepository;
        this.ingredientRepository = ingredientRepository;
        this.breedRepository = breedRepository;
        this.activityTypeRepository = activityTypeRepository;
        this.reproductiveStatusRepository = reproductiveStatusRepository;
        this.healthConditionRepository = healthConditionRepository;
        this.symptomRepository = symptomRepository;
    }

    @Transactional(readOnly = true)
    public List<RecipeListItemResponse> listMine(
        Jwt jwt,
        String query,
        List<String> types,
        List<String> formats,
        List<String> ageCategories,
        List<String> breedSizes,
        List<Long> reproductiveStatusIds,
        List<Long> activityTypeIds,
        List<Long> healthConditionIds,
        List<Long> symptomIds,
        List<Long> ingredientIds,
        UUID petId,
        String status,
        String sortBy,
        String direction
    ) {
        UUID ownerId = subject(jwt);
        Specification<Recipe> specification = (root, criteriaQuery, cb) -> {
            criteriaQuery.distinct(true);
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("ownerId"), ownerId));

            if (query != null && !query.isBlank()) {
                String pattern = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern)
                ));
            }
            addIn(predicates, root.get("type"), types);
            addIn(predicates, root.get("format"), formats);
            addIn(predicates, root.get("ageCategory"), ageCategories);
            addIn(predicates, root.get("breedSize"), breedSizes);
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status.trim().toLowerCase(Locale.ROOT)));
            }
            if (reproductiveStatusIds != null && !reproductiveStatusIds.isEmpty()) {
                predicates.add(root.join("targetReproductiveStatus", JoinType.LEFT).get("id").in(reproductiveStatusIds));
            }
            if (activityTypeIds != null && !activityTypeIds.isEmpty()) {
                predicates.add(root.join("targetActivityType", JoinType.LEFT).get("id").in(activityTypeIds));
            }
            if (healthConditionIds != null && !healthConditionIds.isEmpty()) {
                predicates.add(root.join("targetHealthCondition", JoinType.LEFT).get("id").in(healthConditionIds));
            }
            if (symptomIds != null && !symptomIds.isEmpty()) {
                predicates.add(root.join("targetSymptoms", JoinType.INNER).get("id").in(symptomIds));
            }
            if (ingredientIds != null && !ingredientIds.isEmpty()) {
                predicates.add(root.join("ingredients", JoinType.INNER).get("ingredient").get("id").in(ingredientIds));
            }
            if (petId != null) {
                predicates.add(cb.equal(root.get("pet").get("id"), petId));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };

        String safeSort = SORTABLE_FIELDS.contains(sortBy) ? sortBy : "updatedAt";
        Sort.Direction safeDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return recipeRepository.findAll(specification, Sort.by(safeDirection, safeSort).and(Sort.by("id")))
            .stream()
            .map(this::toListItem)
            .toList();
    }

    @Transactional(readOnly = true)
    public RecipeResponse getMine(Jwt jwt, long id) {
        return toResponse(findMine(id, subject(jwt)));
    }

    @Transactional
    public RecipeResponse create(Jwt jwt, RecipeRequest request) {
        UUID ownerId = subject(jwt);
        Recipe recipe = new Recipe();
        recipe.setOwnerId(ownerId);
        OffsetDateTime now = OffsetDateTime.now();
        recipe.setCreatedAt(now);
        apply(recipe, request, ownerId, now);
        return toResponse(recipeRepository.save(recipe));
    }

    @Transactional
    public RecipeResponse update(Jwt jwt, long id, RecipeRequest request) {
        UUID ownerId = subject(jwt);
        Recipe recipe = findMine(id, ownerId);
        apply(recipe, request, ownerId, OffsetDateTime.now());
        return toResponse(recipeRepository.save(recipe));
    }

    @Transactional
    public void delete(Jwt jwt, long id) {
        recipeRepository.delete(findMine(id, subject(jwt)));
    }

    private void apply(Recipe recipe, RecipeRequest request, UUID ownerId, OffsetDateTime now) {
        recipe.setPet(resolvePet(request.petId(), ownerId));
        recipe.setName(request.name().trim());
        recipe.setDescription(blankToNull(request.description()));
        recipe.setType(request.type());
        recipe.setFormat(request.format());
        recipe.setAgeCategory(request.ageCategory());
        recipe.setBreedSize(request.breedSize());
        recipe.setTargetWeightKg(request.targetWeightKg());
        recipe.setTargetBreed(resolveOptional(request.targetBreedId(), breedRepository::findById, "Breed"));
        recipe.setTargetAgeMonths(request.targetAgeMonths());
        recipe.setTargetGender(request.targetGender());
        recipe.setTargetActivityType(resolveOptional(
            request.targetActivityTypeId(), activityTypeRepository::findById, "Activity type"
        ));
        recipe.setTargetReproductiveStatus(resolveOptional(
            request.targetReproductiveStatusId(), reproductiveStatusRepository::findById, "Reproductive status"
        ));
        recipe.setTargetHealthCondition(resolveOptional(
            request.targetHealthConditionId(), healthConditionRepository::findById, "Health condition"
        ));
        recipe.setTargetSymptoms(resolveSymptoms(request.symptomIds()));
        recipe.setTargetEnergyKcal(request.targetEnergyKcal());
        recipe.setMaximizeNutrient(blankToNull(request.maximizeNutrient()));

        boolean calculated = request.calculationResult() != null && !request.calculationResult().isNull();
        recipe.setCalculationResult(calculated ? request.calculationResult() : null);
        recipe.setCalculationVersion(calculated ? blankToNull(request.calculationVersion()) : null);
        recipe.setCalculatedAt(calculated ? now : null);
        recipe.setStatus(calculated ? "calculated" : "draft");
        recipe.setUpdatedAt(now);

        replaceIngredients(recipe, request.ingredients());
        replaceNutrientConstraints(recipe, request.nutrientConstraints());
    }

    private void replaceIngredients(Recipe recipe, List<RecipeIngredientRequest> requests) {
        List<RecipeIngredientRequest> safeRequests = requests == null ? List.of() : requests;
        Set<Long> ids = safeRequests.stream()
            .map(RecipeIngredientRequest::ingredientId)
            .collect(Collectors.toCollection(LinkedHashSet::new));
        if (ids.size() != safeRequests.size()) {
            throw new BadRequestException("Ingredient IDs must be unique within a recipe");
        }
        for (RecipeIngredientRequest request : safeRequests) {
            if (request.minPercent() > request.maxPercent()) {
                throw new BadRequestException("Ingredient minPercent cannot exceed maxPercent");
            }
            if (request.resultPercent() != null && request.resultPercent() > 100) {
                throw new BadRequestException("Ingredient resultPercent cannot exceed 100");
            }
        }

        Map<Long, Ingredient> ingredientsById = ingredientRepository.findAllById(ids).stream()
            .collect(Collectors.toMap(Ingredient::getId, Function.identity()));
        if (ingredientsById.size() != ids.size()) {
            throw new BadRequestException("One or more ingredients do not exist");
        }

        Map<Long, RecipeIngredient> existingItems = recipe.getIngredients().stream()
            .collect(Collectors.toMap(item -> item.getIngredient().getId(), Function.identity()));
        recipe.getIngredients().removeIf(item -> !ids.contains(item.getIngredient().getId()));
        for (RecipeIngredientRequest request : safeRequests) {
            RecipeIngredient item = existingItems.get(request.ingredientId());
            if (item == null) {
                item = new RecipeIngredient();
                item.setRecipe(recipe);
                item.setIngredient(ingredientsById.get(request.ingredientId()));
                recipe.getIngredients().add(item);
            }
            item.setMinPercent(request.minPercent());
            item.setMaxPercent(request.maxPercent());
            item.setResultPercent(request.resultPercent());
            item.setResultGrams(request.resultGrams());
        }
    }

    private void replaceNutrientConstraints(
        Recipe recipe,
        List<RecipeNutrientConstraintRequest> requests
    ) {
        List<RecipeNutrientConstraintRequest> safeRequests = requests == null ? List.of() : requests;
        Set<String> keys = new HashSet<>();
        Map<String, RecipeNutrientConstraint> existingItems = recipe.getNutrientConstraints().stream()
            .collect(Collectors.toMap(RecipeNutrientConstraint::getNutrientKey, Function.identity()));
        for (RecipeNutrientConstraintRequest request : safeRequests) {
            String key = request.nutrientKey().trim();
            if (!NUTRIENT_KEYS.contains(key)) {
                throw new BadRequestException("Unsupported nutrient key: " + key);
            }
            if (!keys.add(key)) {
                throw new BadRequestException("Nutrient constraint keys must be unique");
            }
            if (request.minValue() > request.maxValue()) {
                throw new BadRequestException("Nutrient minValue cannot exceed maxValue");
            }
            RecipeNutrientConstraint item = existingItems.get(key);
            if (item == null) {
                item = new RecipeNutrientConstraint();
                item.setRecipe(recipe);
                item.setNutrientKey(key);
                recipe.getNutrientConstraints().add(item);
            }
            item.setMinValue(request.minValue());
            item.setMaxValue(request.maxValue());
        }
        recipe.getNutrientConstraints().removeIf(item -> !keys.contains(item.getNutrientKey()));
    }

    private Set<Symptom> resolveSymptoms(List<Long> symptomIds) {
        if (symptomIds == null || symptomIds.isEmpty()) return new LinkedHashSet<>();
        Set<Long> uniqueIds = new LinkedHashSet<>(symptomIds);
        List<Symptom> symptoms = symptomRepository.findAllById(uniqueIds);
        if (symptoms.size() != uniqueIds.size()) {
            throw new BadRequestException("One or more symptoms do not exist");
        }
        Map<Long, Symptom> byId = symptoms.stream()
            .collect(Collectors.toMap(Symptom::getId, Function.identity()));
        return uniqueIds.stream()
            .map(byId::get)
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private Pet resolvePet(UUID petId, UUID ownerId) {
        if (petId == null) return null;
        Pet pet = petRepository.findById(petId)
            .orElseThrow(() -> new BadRequestException("Pet not found: " + petId));
        if (!ownerId.equals(pet.getOwnerId())) {
            throw new ForbiddenOperationException("You can only attach recipes to your own pets");
        }
        return pet;
    }

    private <T> T resolveOptional(
        Long id,
        Function<Long, Optional<T>> finder,
        String resourceName
    ) {
        if (id == null) return null;
        return finder.apply(id)
            .orElseThrow(() -> new BadRequestException(resourceName + " not found: " + id));
    }

    private Recipe findMine(long id, UUID ownerId) {
        return recipeRepository.findByIdAndOwnerId(id, ownerId)
            .orElseThrow(() -> new NotFoundException("Recipe not found: " + id));
    }

    private RecipeListItemResponse toListItem(Recipe recipe) {
        return new RecipeListItemResponse(
            recipe.getId(),
            recipe.getPet() == null ? null : recipe.getPet().getId(),
            recipe.getPet() == null ? null : recipe.getPet().getName(),
            recipe.getName(),
            recipe.getType(),
            recipe.getFormat(),
            recipe.getAgeCategory(),
            recipe.getBreedSize(),
            recipe.getStatus(),
            recipe.getCalculationResult() != null
                && recipe.getCalculationResult().path("calories").isNumber()
                ? recipe.getCalculationResult().path("calories").asDouble()
                : null,
            recipe.getCreatedAt(),
            recipe.getUpdatedAt()
        );
    }

    private RecipeResponse toResponse(Recipe recipe) {
        Breed breed = recipe.getTargetBreed();
        ActivityType activity = recipe.getTargetActivityType();
        ReproductiveStatus reproductiveStatus = recipe.getTargetReproductiveStatus();
        HealthCondition healthCondition = recipe.getTargetHealthCondition();
        return new RecipeResponse(
            recipe.getId(),
            recipe.getOwnerId(),
            recipe.getPet() == null ? null : recipe.getPet().getId(),
            recipe.getPet() == null ? null : recipe.getPet().getName(),
            recipe.getName(),
            recipe.getDescription(),
            recipe.getType(),
            recipe.getFormat(),
            recipe.getAgeCategory(),
            recipe.getBreedSize(),
            recipe.getTargetWeightKg(),
            breed == null ? null : breed.getId(),
            breed == null ? null : breed.getName(),
            recipe.getTargetAgeMonths(),
            recipe.getTargetGender(),
            activity == null ? null : activity.getId(),
            activity == null ? null : activity.getName(),
            reproductiveStatus == null ? null : reproductiveStatus.getId(),
            reproductiveStatus == null ? null : reproductiveStatus.getName(),
            healthCondition == null ? null : healthCondition.getId(),
            healthCondition == null ? null : healthCondition.getNameRu(),
            recipe.getTargetSymptoms().stream()
                .map(symptom -> new RecipeResponse.ReferenceItem(symptom.getId(), symptom.getName()))
                .toList(),
            recipe.getTargetEnergyKcal(),
            recipe.getMaximizeNutrient(),
            recipe.getStatus(),
            recipe.getIngredients().stream()
                .map(item -> new RecipeResponse.IngredientItem(
                    item.getIngredient().getId(),
                    item.getIngredient().getName(),
                    item.getIngredient().getSubtype(),
                    item.getIngredient().getCategory(),
                    item.getMinPercent(),
                    item.getMaxPercent(),
                    item.getResultPercent(),
                    item.getResultGrams()
                ))
                .toList(),
            recipe.getNutrientConstraints().stream()
                .map(item -> new RecipeResponse.NutrientConstraintItem(
                    item.getNutrientKey(),
                    item.getMinValue(),
                    item.getMaxValue()
                ))
                .toList(),
            recipe.getCalculationResult(),
            recipe.getCalculationVersion(),
            recipe.getCalculatedAt(),
            recipe.getCreatedAt(),
            recipe.getUpdatedAt()
        );
    }

    private static <T> void addIn(
        List<Predicate> predicates,
        jakarta.persistence.criteria.Path<T> path,
        List<T> values
    ) {
        if (values != null && !values.isEmpty()) {
            predicates.add(path.in(values));
        }
    }

    private UUID subject(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
