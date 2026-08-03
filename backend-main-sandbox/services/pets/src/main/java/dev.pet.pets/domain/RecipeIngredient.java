package dev.pet.pets.domain;

import jakarta.persistence.*;

@Entity
@Table(
    name = "recipe_ingredients",
    schema = "pets",
    uniqueConstraints = @UniqueConstraint(
        name = "recipe_ingredients_unique",
        columnNames = {"recipe_id", "ingredient_id"}
    )
)
public class RecipeIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(name = "min_percent", nullable = false)
    private double minPercent;

    @Column(name = "max_percent", nullable = false)
    private double maxPercent;

    @Column(name = "result_percent")
    private Double resultPercent;

    @Column(name = "result_grams")
    private Double resultGrams;

    public Long getId() { return id; }
    public Recipe getRecipe() { return recipe; }
    public void setRecipe(Recipe recipe) { this.recipe = recipe; }
    public Ingredient getIngredient() { return ingredient; }
    public void setIngredient(Ingredient ingredient) { this.ingredient = ingredient; }
    public double getMinPercent() { return minPercent; }
    public void setMinPercent(double minPercent) { this.minPercent = minPercent; }
    public double getMaxPercent() { return maxPercent; }
    public void setMaxPercent(double maxPercent) { this.maxPercent = maxPercent; }
    public Double getResultPercent() { return resultPercent; }
    public void setResultPercent(Double resultPercent) { this.resultPercent = resultPercent; }
    public Double getResultGrams() { return resultGrams; }
    public void setResultGrams(Double resultGrams) { this.resultGrams = resultGrams; }
}
