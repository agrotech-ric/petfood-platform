package dev.pet.pets.repo;

import dev.pet.pets.domain.PetOwnerRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PetOwnerRecordRepository extends JpaRepository<PetOwnerRecord, UUID> {
    List<PetOwnerRecord> findByOwner_IdAndStatusOrderByRecordDateAscRecordTimeAsc(UUID ownerId, String status);
    Optional<PetOwnerRecord> findByIdAndOwner_Id(UUID id, UUID ownerId);
    long countByOwner_IdAndStatus(UUID ownerId, String status);
    long deleteByOwner_IdAndStatus(UUID ownerId, String status);
}
