package dev.pet.pets.dto;

public class BreedItem {
    private Long id;
    private Long speciesId;
    private String nameRu;
    private String nameEn;
    private String sizeCategory;

    public BreedItem(Long id, Long speciesId, String nameRu, String nameEn) {
        this(id, speciesId, nameRu, nameEn, null);
    }

    public BreedItem(Long id, Long speciesId, String nameRu, String nameEn, String sizeCategory) {
        this.id = id;
        this.speciesId = speciesId;
        this.nameRu = nameRu;
        this.nameEn = nameEn;
        this.sizeCategory = sizeCategory;
    }

    public Long getId() { return id; }
    public Long getSpeciesId() { return speciesId; }
    public String getNameRu() { return nameRu; }
    public String getNameEn() { return nameEn; }
    public String getSizeCategory() { return sizeCategory; }
}
