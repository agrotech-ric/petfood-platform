package dev.pet.pets.search;

import java.util.Collections;
import java.util.List;

public class PetSearchFilter {

    private String q;
    private List<String> genders = Collections.emptyList();
    private List<String> ageGroups = Collections.emptyList();
    private Double minWeight;
    private Double maxWeight;
    private List<Long> breedIds = Collections.emptyList();
    private List<String> sizeCategories = Collections.emptyList();
    private List<Long> reproductiveStatusIds = Collections.emptyList();
    private List<Long> activityTypeIds = Collections.emptyList();
    private List<Long> symptomIds = Collections.emptyList();
    private List<String> healthConditionCodes = Collections.emptyList();
    private String favorite; // all, saved, unsaved
    private String recipeStatus; // all, calculated, not_calculated

    public String getQ() { return q; }
    public void setQ(String q) { this.q = q; }

    public List<String> getGenders() { return genders; }
    public void setGenders(List<String> genders) { this.genders = genders != null ? genders : Collections.emptyList(); }

    public List<String> getAgeGroups() { return ageGroups; }
    public void setAgeGroups(List<String> ageGroups) { this.ageGroups = ageGroups != null ? ageGroups : Collections.emptyList(); }

    public Double getMinWeight() { return minWeight; }
    public void setMinWeight(Double minWeight) { this.minWeight = minWeight; }

    public Double getMaxWeight() { return maxWeight; }
    public void setMaxWeight(Double maxWeight) { this.maxWeight = maxWeight; }

    public List<Long> getBreedIds() { return breedIds; }
    public void setBreedIds(List<Long> breedIds) { this.breedIds = breedIds != null ? breedIds : Collections.emptyList(); }

    public List<String> getSizeCategories() { return sizeCategories; }
    public void setSizeCategories(List<String> sizeCategories) { this.sizeCategories = sizeCategories != null ? sizeCategories : Collections.emptyList(); }

    public List<Long> getReproductiveStatusIds() { return reproductiveStatusIds; }
    public void setReproductiveStatusIds(List<Long> reproductiveStatusIds) {
        this.reproductiveStatusIds = reproductiveStatusIds != null ? reproductiveStatusIds : Collections.emptyList();
    }

    public List<Long> getActivityTypeIds() { return activityTypeIds; }
    public void setActivityTypeIds(List<Long> activityTypeIds) {
        this.activityTypeIds = activityTypeIds != null ? activityTypeIds : Collections.emptyList();
    }

    public List<Long> getSymptomIds() { return symptomIds; }
    public void setSymptomIds(List<Long> symptomIds) { this.symptomIds = symptomIds != null ? symptomIds : Collections.emptyList(); }

    public List<String> getHealthConditionCodes() { return healthConditionCodes; }
    public void setHealthConditionCodes(List<String> healthConditionCodes) {
        this.healthConditionCodes = healthConditionCodes != null ? healthConditionCodes : Collections.emptyList();
    }

    public String getFavorite() { return favorite; }
    public void setFavorite(String favorite) { this.favorite = favorite; }

    public String getRecipeStatus() { return recipeStatus; }
    public void setRecipeStatus(String recipeStatus) { this.recipeStatus = recipeStatus; }
}
