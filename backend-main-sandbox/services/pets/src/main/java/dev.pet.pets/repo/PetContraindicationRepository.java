package dev.pet.pets.repo;

import dev.pet.pets.domain.PetContraindication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PetContraindicationRepository extends JpaRepository<PetContraindication, UUID> {
    Optional<PetContraindication> findByPetId(UUID petId);
}
