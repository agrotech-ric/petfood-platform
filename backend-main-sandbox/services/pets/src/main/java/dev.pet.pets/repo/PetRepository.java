package dev.pet.pets.repo;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import dev.pet.pets.domain.Pet;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface PetRepository extends JpaRepository<Pet, UUID>, JpaSpecificationExecutor<Pet> {
    List<Pet> findByOwnerId(UUID ownerId);

    List<Pet> findByPetOwner_IdOrderByNameAsc(UUID petOwnerId);

    List<Pet> findByPetOwnerIsNullOrderByNameAsc();

    long countByPetOwner_Id(UUID petOwnerId);

    boolean existsByPhotoObjectKey(String photoObjectKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Pet p where p.id = :id")
    Optional<Pet> findByIdForUpdate(@Param("id") UUID id);
}
