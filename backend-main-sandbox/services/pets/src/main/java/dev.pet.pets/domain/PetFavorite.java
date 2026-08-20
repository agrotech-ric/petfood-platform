package dev.pet.pets.domain;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "pet_favorites", schema = "pets")
public class PetFavorite {

    @EmbeddedId
    private PetFavoriteId id;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    public PetFavoriteId getId() { return id; }
    public void setId(PetFavoriteId id) { this.id = id; }
}
