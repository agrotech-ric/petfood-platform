package dev.pet.account.repository;

import dev.pet.account.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findByUserId(UUID userId, Pageable pageable);
    Page<AuditLog> findByEventType(String eventType, Pageable pageable);
    Page<AuditLog> findByUserIdAndEventType(UUID userId, String eventType, Pageable pageable);
}
