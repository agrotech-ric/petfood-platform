package dev.pet.pets.search;

import java.util.UUID;

public class PetSearchRow {
    private final UUID petId;
    private final boolean favorite;
    private final boolean hasRecommendation;

    public PetSearchRow(UUID petId, boolean favorite, boolean hasRecommendation) {
        this.petId = petId;
        this.favorite = favorite;
        this.hasRecommendation = hasRecommendation;
    }

    public UUID getPetId() { return petId; }
    public boolean isFavorite() { return favorite; }
    public boolean isHasRecommendation() { return hasRecommendation; }
}
