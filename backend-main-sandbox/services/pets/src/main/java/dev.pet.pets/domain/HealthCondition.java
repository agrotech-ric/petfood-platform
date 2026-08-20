package dev.pet.pets.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "health_conditions", schema = "pets")
public class HealthCondition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(name = "name_ru", nullable = false, length = 128)
    private String nameRu;

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getNameRu() { return nameRu; }
}
