package dev.pet.pets.dto;

public class HealthConditionItem {
    private Long id;
    private String code;
    private String nameRu;

    public HealthConditionItem(Long id, String code, String nameRu) {
        this.id = id;
        this.code = code;
        this.nameRu = nameRu;
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getNameRu() { return nameRu; }
}
