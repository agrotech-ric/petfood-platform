package dev.pet.pets.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class PetFavoriteId implements Serializable {

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "pet_id", nullable = false)
    private UUID petId;

    public PetFavoriteId() {}

    public PetFavoriteId(UUID ownerId, UUID petId) {
        this.ownerId = ownerId;
        this.petId = petId;
    }

    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }

    public UUID getPetId() { return petId; }
    public void setPetId(UUID petId) { this.petId = petId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PetFavoriteId that)) return false;
        return Objects.equals(ownerId, that.ownerId) && Objects.equals(petId, that.petId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(ownerId, petId);
    }
}
