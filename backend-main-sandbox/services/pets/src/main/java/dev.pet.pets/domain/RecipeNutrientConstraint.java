package dev.pet.pets.domain;

import jakarta.persistence.*;

@Entity
@Table(
    name = "recipe_nutrient_constraints",
    schema = "pets",
    uniqueConstraints = @UniqueConstraint(
        name = "recipe_nutrient_constraints_unique",
        columnNames = {"recipe_id", "nutrient_key"}
    )
)
public class RecipeNutrientConstraint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @Column(name = "nutrient_key", nullable = false, length = 64)
    private String nutrientKey;

    @Column(name = "min_value", nullable = false)
    private double minValue;

    @Column(name = "max_value", nullable = false)
    private double maxValue;

    public Long getId() { return id; }
    public Recipe getRecipe() { return recipe; }
    public void setRecipe(Recipe recipe) { this.recipe = recipe; }
    public String getNutrientKey() { return nutrientKey; }
    public void setNutrientKey(String nutrientKey) { this.nutrientKey = nutrientKey; }
    public double getMinValue() { return minValue; }
    public void setMinValue(double minValue) { this.minValue = minValue; }
    public double getMaxValue() { return maxValue; }
    public void setMaxValue(double maxValue) { this.maxValue = maxValue; }
}
