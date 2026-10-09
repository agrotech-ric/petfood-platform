package dev.pet.pets.repo;

import dev.pet.pets.domain.PetOwner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PetOwnerRepository extends JpaRepository<PetOwner, UUID> {
    @Query("""
        select o from PetOwner o
        where :q is null or :q = ''
           or lower(coalesce(o.fullName, '')) like lower(concat('%', :q, '%'))
           or lower(coalesce(o.email, '')) like lower(concat('%', :q, '%'))
           or coalesce(o.phone, '') like concat('%', :q, '%')
           or lower(coalesce(o.telegram, '')) like lower(concat('%', :q, '%'))
        order by o.placeholder asc, o.fullName asc, o.createdAt desc
        """)
    List<PetOwner> search(@Param("q") String q);
}
