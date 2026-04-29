package dev.pet.account.repository;

import dev.pet.account.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    Page<User> findByEmailContainingIgnoreCase(
        String email,
        Pageable pageable
    );

    @Query("""
        select u from User u
        where lower(u.email) like lower(concat('%', :q, '%'))
           or lower(coalesce(u.firstName, '')) like lower(concat('%', :q, '%'))
           or lower(coalesce(u.lastName, '')) like lower(concat('%', :q, '%'))
    """)
    Page<User> adminDirectorySearch(@Param("q") String q, Pageable pageable);
}
