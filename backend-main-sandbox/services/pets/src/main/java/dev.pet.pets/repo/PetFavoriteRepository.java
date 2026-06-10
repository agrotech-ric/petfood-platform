package dev.pet.pets.repo;

import dev.pet.pets.domain.PetFavorite;
import dev.pet.pets.domain.PetFavoriteId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface PetFavoriteRepository extends JpaRepository<PetFavorite, PetFavoriteId> {

    boolean existsByIdOwnerIdAndIdPetId(UUID ownerId, UUID petId);

    @Query("select f.id.petId from PetFavorite f where f.id.ownerId = :ownerId")
    Set<UUID> findPetIdsByOwnerId(UUID ownerId);

    void deleteByIdOwnerIdAndIdPetId(UUID ownerId, UUID petId);
}
