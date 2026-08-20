package dev.pet.pets.dto;

public class PetListItemResponse extends PetResponse {

    private boolean favorite;
    private boolean hasRecommendation;

    public boolean isFavorite() { return favorite; }
    public void setFavorite(boolean favorite) { this.favorite = favorite; }

    public boolean isHasRecommendation() { return hasRecommendation; }
    public void setHasRecommendation(boolean hasRecommendation) { this.hasRecommendation = hasRecommendation; }
}
