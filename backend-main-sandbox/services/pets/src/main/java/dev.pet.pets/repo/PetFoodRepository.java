package dev.pet.pets.repo;

import dev.pet.pets.domain.PetFood;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PetFoodRepository extends JpaRepository<PetFood, UUID> {
    List<PetFood> findByPetIdAndOwnerIdOrderByUpdatedAtDesc(UUID petId, UUID ownerId);
}
