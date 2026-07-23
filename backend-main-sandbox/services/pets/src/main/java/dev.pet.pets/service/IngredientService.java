package dev.pet.pets.service;

import dev.pet.pets.domain.Ingredient;
import dev.pet.pets.dto.IngredientRequest;
import dev.pet.pets.dto.IngredientResponse;
import dev.pet.pets.error.NotFoundException;
import dev.pet.pets.repo.IngredientRepository;
import jakarta.persistence.criteria.Predicate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IngredientService {

    private static final Set<String> FILTERABLE_NUTRIENTS = Set.of(
        "protein", "fat", "moisture", "fiber", "ash", "cholesterol", "choline", "selenium", "iodine",
        "vitaminA", "vitaminE", "vitaminD", "vitaminB1", "vitaminB2", "vitaminC", "linoleic",
        "alphaLinolenic", "epa", "dha", "alphaCarotene", "betaCarotene", "retinol"
    );
    private static final Set<String> SORTABLE_FIELDS = Set.of(
        "id", "category", "name", "subtype", "protein", "fat", "moisture", "calcium", "phosphorus", "vitaminB1"
    );

    private final IngredientRepository repository;

    public IngredientService(IngredientRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<IngredientResponse> list(
        String query,
        String category,
        List<String> nutrients,
        String sortBy,
        String direction
    ) {
        Specification<Ingredient> specification = (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (query != null && !query.isBlank()) {
                String pattern = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("category")), pattern),
                    cb.like(cb.lower(root.get("subtype")), pattern)
                ));
            }
            if (category != null && !category.isBlank()) {
                predicates.add(cb.equal(root.get("category"), category.trim()));
            }
            if (nutrients != null) {
                nutrients.stream()
                    .filter(FILTERABLE_NUTRIENTS::contains)
                    .distinct()
                    .forEach(nutrient -> predicates.add(cb.gt(root.get(nutrient), 0)));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };

        String safeSort = SORTABLE_FIELDS.contains(sortBy) ? sortBy : "category";
        Sort.Direction safeDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        return repository.findAll(specification, Sort.by(safeDirection, safeSort).and(Sort.by("id")))
            .stream()
            .map(IngredientResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public IngredientResponse get(long id) {
        return IngredientResponse.from(find(id));
    }

    @Transactional
    public IngredientResponse create(IngredientRequest request) {
        Ingredient ingredient = new Ingredient();
        apply(ingredient, request);
        OffsetDateTime now = OffsetDateTime.now();
        ingredient.setCreatedAt(now);
        ingredient.setUpdatedAt(now);
        return IngredientResponse.from(repository.save(ingredient));
    }

    @Transactional
    public IngredientResponse update(long id, IngredientRequest request) {
        Ingredient ingredient = find(id);
        apply(ingredient, request);
        ingredient.setUpdatedAt(OffsetDateTime.now());
        return IngredientResponse.from(repository.save(ingredient));
    }

    @Transactional
    public void delete(long id) {
        repository.delete(find(id));
    }

    private Ingredient find(long id) {
        return repository.findById(id)
            .orElseThrow(() -> new NotFoundException("Ingredient not found: " + id));
    }

    private void apply(Ingredient ingredient, IngredientRequest request) {
        ingredient.setCategory(request.category().trim());
        ingredient.setName(request.name().trim());
        ingredient.setSubtype(request.subtype() == null || request.subtype().isBlank() ? null : request.subtype().trim());
        ingredient.setPortion(request.portion());
        ingredient.setCalories(request.calories());
        ingredient.setProtein(request.protein());
        ingredient.setFat(request.fat());
        ingredient.setCarbs(request.carbs());
        ingredient.setMoisture(request.moisture());
        ingredient.setFiber(request.fiber());
        ingredient.setAsh(request.ash());
        ingredient.setCholesterol(request.cholesterol());
        ingredient.setSugar(request.sugar());
        ingredient.setCalcium(request.calcium());
        ingredient.setPhosphorus(request.phosphorus());
        ingredient.setMagnesium(request.magnesium());
        ingredient.setSodium(request.sodium());
        ingredient.setPotassium(request.potassium());
        ingredient.setIron(request.iron());
        ingredient.setCopper(request.copper());
        ingredient.setZinc(request.zinc());
        ingredient.setManganese(request.manganese());
        ingredient.setLinoleic(request.linoleic());
        ingredient.setAlphaLinolenic(request.alphaLinolenic());
        ingredient.setArachidonic(request.arachidonic());
        ingredient.setEpa(request.epa());
        ingredient.setDha(request.dha());
        ingredient.setCholine(request.choline());
        ingredient.setSelenium(request.selenium());
        ingredient.setIodine(request.iodine());
        ingredient.setVitaminA(request.vitaminA());
        ingredient.setVitaminE(request.vitaminE());
        ingredient.setVitaminD(request.vitaminD());
        ingredient.setVitaminB1(request.vitaminB1());
        ingredient.setVitaminB2(request.vitaminB2());
        ingredient.setVitaminB3(request.vitaminB3());
        ingredient.setVitaminB5(request.vitaminB5());
        ingredient.setVitaminB6(request.vitaminB6());
        ingredient.setVitaminB9(request.vitaminB9());
        ingredient.setVitaminB12(request.vitaminB12());
        ingredient.setVitaminC(request.vitaminC());
        ingredient.setVitaminK(request.vitaminK());
        ingredient.setAlphaCarotene(request.alphaCarotene());
        ingredient.setBetaCarotene(request.betaCarotene());
        ingredient.setBetaCryptoxanthin(request.betaCryptoxanthin());
        ingredient.setLuteinZeaxanthin(request.luteinZeaxanthin());
        ingredient.setLycopene(request.lycopene());
        ingredient.setRetinol(request.retinol());
    }
}
