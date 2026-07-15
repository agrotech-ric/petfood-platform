package dev.pet.pets.dto;

import jakarta.validation.constraints.Size;
import java.util.List;

public class UpdatePetContraindicationsRequest {

    @Size(max = 200)
    private List<@Size(max = 255) String> ingredients;

    @Size(max = 2000)
    private String description;

    public List<String> getIngredients() {
        return ingredients;
    }

    public void setIngredients(List<String> ingredients) {
        this.ingredients = ingredients;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
