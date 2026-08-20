package dev.pet.account.repository;

import dev.pet.account.domain.AdminAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AdminActionRepository extends JpaRepository<AdminAction, UUID> {
    Page<AdminAction> findByAdminIdOrderByCreatedAtDesc(UUID adminId, Pageable pageable);
    Page<AdminAction> findByTargetUserIdOrderByCreatedAtDesc(UUID targetUserId, Pageable pageable);
}
