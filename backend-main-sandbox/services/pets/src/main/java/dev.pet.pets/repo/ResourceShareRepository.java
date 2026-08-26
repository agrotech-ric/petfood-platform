package dev.pet.pets.repo;

import dev.pet.pets.domain.ResourceShare;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ResourceShareRepository extends JpaRepository<ResourceShare, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from ResourceShare s where s.pet.id = :petId and s.revokedAt is null")
    Optional<ResourceShare> findActivePetForUpdate(@Param("petId") UUID petId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from ResourceShare s where s.recipe.id = :recipeId and s.revokedAt is null")
    Optional<ResourceShare> findActiveRecipeForUpdate(@Param("recipeId") Long recipeId);

    Optional<ResourceShare> findByIdAndRevokedAtIsNull(UUID id);
    Optional<ResourceShare> findByPet_IdAndRevokedAtIsNull(UUID petId);
    Optional<ResourceShare> findByRecipe_IdAndRevokedAtIsNull(Long recipeId);
}
