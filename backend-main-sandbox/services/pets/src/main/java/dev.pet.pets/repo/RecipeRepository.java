package dev.pet.pets.repo;

import dev.pet.pets.domain.Recipe;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.List;

public interface RecipeRepository extends JpaRepository<Recipe, Long>, JpaSpecificationExecutor<Recipe> {
    Optional<Recipe> findByIdAndOwnerId(Long id, UUID ownerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Recipe r where r.id = :id")
    Optional<Recipe> findByIdForUpdate(@Param("id") Long id);

    List<Recipe> findByPet_IdAndOwnerIdAndStatusOrderByUpdatedAtDesc(UUID petId, UUID ownerId, String status);
}
