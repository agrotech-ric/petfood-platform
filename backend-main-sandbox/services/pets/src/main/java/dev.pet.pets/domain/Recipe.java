package dev.pet.pets.domain;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "recipes", schema = "pets")
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id")
    private Pet pet;

    @Column(nullable = false, length = 255)
    private String name;

    @Column
    private String description;

    @Column(name = "recipe_type", nullable = false, length = 32)
    private String type;

    @Column(name = "food_format", nullable = false, length = 32)
    private String format;

    @Column(name = "age_category", nullable = false, length = 32)
    private String ageCategory;

    @Column(name = "breed_size", nullable = false, length = 32)
    private String breedSize;

    @Column(name = "target_weight_kg")
    private Double targetWeightKg;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_breed_id")
    private Breed targetBreed;

    @Column(name = "target_age_months")
    private Integer targetAgeMonths;

    @Column(name = "target_gender", length = 16)
    private String targetGender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_activity_type_id")
    private ActivityType targetActivityType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_reproductive_status_id")
    private ReproductiveStatus targetReproductiveStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_health_condition_id")
    private HealthCondition targetHealthCondition;

    @ManyToMany
    @JoinTable(
        name = "recipe_symptoms",
        schema = "pets",
        joinColumns = @JoinColumn(name = "recipe_id"),
        inverseJoinColumns = @JoinColumn(name = "symptom_id")
    )
    @OrderBy("id ASC")
    private Set<Symptom> targetSymptoms = new LinkedHashSet<>();

    @Column(name = "target_energy_kcal")
    private Double targetEnergyKcal;

    @Column(name = "maximize_nutrient", length = 64)
    private String maximizeNutrient;

    @Column(nullable = false, length = 32)
    private String status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "calculation_result", columnDefinition = "jsonb")
    private JsonNode calculationResult;

    @Column(name = "calculation_version", length = 64)
    private String calculationVersion;

    @Column(name = "calculated_at")
    private OffsetDateTime calculatedAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<RecipeIngredient> ingredients = new ArrayList<>();

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<RecipeNutrientConstraint> nutrientConstraints = new ArrayList<>();

    public Long getId() { return id; }
    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }
    public Pet getPet() { return pet; }
    public void setPet(Pet pet) { this.pet = pet; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }
    public String getAgeCategory() { return ageCategory; }
    public void setAgeCategory(String ageCategory) { this.ageCategory = ageCategory; }
    public String getBreedSize() { return breedSize; }
    public void setBreedSize(String breedSize) { this.breedSize = breedSize; }
    public Double getTargetWeightKg() { return targetWeightKg; }
    public void setTargetWeightKg(Double targetWeightKg) { this.targetWeightKg = targetWeightKg; }
    public Breed getTargetBreed() { return targetBreed; }
    public void setTargetBreed(Breed targetBreed) { this.targetBreed = targetBreed; }
    public Integer getTargetAgeMonths() { return targetAgeMonths; }
    public void setTargetAgeMonths(Integer targetAgeMonths) { this.targetAgeMonths = targetAgeMonths; }
    public String getTargetGender() { return targetGender; }
    public void setTargetGender(String targetGender) { this.targetGender = targetGender; }
    public ActivityType getTargetActivityType() { return targetActivityType; }
    public void setTargetActivityType(ActivityType targetActivityType) { this.targetActivityType = targetActivityType; }
    public ReproductiveStatus getTargetReproductiveStatus() { return targetReproductiveStatus; }
    public void setTargetReproductiveStatus(ReproductiveStatus targetReproductiveStatus) { this.targetReproductiveStatus = targetReproductiveStatus; }
    public HealthCondition getTargetHealthCondition() { return targetHealthCondition; }
    public void setTargetHealthCondition(HealthCondition targetHealthCondition) { this.targetHealthCondition = targetHealthCondition; }
    public Set<Symptom> getTargetSymptoms() { return targetSymptoms; }
    public void setTargetSymptoms(Set<Symptom> targetSymptoms) { this.targetSymptoms = targetSymptoms; }
    public Double getTargetEnergyKcal() { return targetEnergyKcal; }
    public void setTargetEnergyKcal(Double targetEnergyKcal) { this.targetEnergyKcal = targetEnergyKcal; }
    public String getMaximizeNutrient() { return maximizeNutrient; }
    public void setMaximizeNutrient(String maximizeNutrient) { this.maximizeNutrient = maximizeNutrient; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public JsonNode getCalculationResult() { return calculationResult; }
    public void setCalculationResult(JsonNode calculationResult) { this.calculationResult = calculationResult; }
    public String getCalculationVersion() { return calculationVersion; }
    public void setCalculationVersion(String calculationVersion) { this.calculationVersion = calculationVersion; }
    public OffsetDateTime getCalculatedAt() { return calculatedAt; }
    public void setCalculatedAt(OffsetDateTime calculatedAt) { this.calculatedAt = calculatedAt; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
    public List<RecipeIngredient> getIngredients() { return ingredients; }
    public List<RecipeNutrientConstraint> getNutrientConstraints() { return nutrientConstraints; }
}
