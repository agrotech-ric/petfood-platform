package dev.pet.pets.repo;

import dev.pet.pets.domain.HealthCondition;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HealthConditionRepository extends JpaRepository<HealthCondition, Long> {
}
