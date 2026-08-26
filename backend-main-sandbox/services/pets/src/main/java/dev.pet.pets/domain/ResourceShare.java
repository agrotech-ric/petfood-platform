package dev.pet.pets.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "resource_shares", schema = "pets")
public class ResourceShare {

    @Id
    @Column(nullable = false)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", nullable = false, length = 16)
    private ShareResourceType resourceType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", foreignKey = @ForeignKey(name = "resource_shares_pet_id_fkey"))
    private Pet pet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", foreignKey = @ForeignKey(name = "resource_shares_recipe_id_fkey"))
    private Recipe recipe;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "revoked_at")
    private OffsetDateTime revokedAt;

    public static ResourceShare forPet(Pet pet, OffsetDateTime now) {
        ResourceShare share = base(pet.getOwnerId(), ShareResourceType.PET, now);
        share.pet = pet;
        return share;
    }

    public static ResourceShare forRecipe(Recipe recipe, OffsetDateTime now) {
        ResourceShare share = base(recipe.getOwnerId(), ShareResourceType.RECIPE, now);
        share.recipe = recipe;
        return share;
    }

    private static ResourceShare base(UUID ownerId, ShareResourceType type, OffsetDateTime now) {
        ResourceShare share = new ResourceShare();
        share.id = UUID.randomUUID();
        share.ownerId = ownerId;
        share.resourceType = type;
        share.createdAt = now;
        return share;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }
    public ShareResourceType getResourceType() { return resourceType; }
    public void setResourceType(ShareResourceType resourceType) { this.resourceType = resourceType; }
    public Pet getPet() { return pet; }
    public void setPet(Pet pet) { this.pet = pet; }
    public Recipe getRecipe() { return recipe; }
    public void setRecipe(Recipe recipe) { this.recipe = recipe; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getRevokedAt() { return revokedAt; }
    public void setRevokedAt(OffsetDateTime revokedAt) { this.revokedAt = revokedAt; }
    public boolean isActive() { return revokedAt == null; }
}
