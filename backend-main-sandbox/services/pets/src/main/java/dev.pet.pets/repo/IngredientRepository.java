package dev.pet.pets.repo;

import dev.pet.pets.domain.Ingredient;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IngredientRepository extends JpaRepository<Ingredient, Long>, JpaSpecificationExecutor<Ingredient> {
    @Query("""
        select (count(i) > 0)
        from Ingredient i
        where lower(i.name) = lower(:name)
          and lower(coalesce(i.subtype, '')) = lower(:subtype)
          and (i.ownerId is null or i.ownerId = :ownerId)
          and (:excludedId is null or i.id <> :excludedId)
        """)
    boolean existsVisibleDuplicate(
        @Param("name") String name,
        @Param("subtype") String subtype,
        @Param("ownerId") UUID ownerId,
        @Param("excludedId") Long excludedId
    );
}
