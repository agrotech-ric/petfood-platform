package dev.pet.account.service;

import dev.pet.account.domain.AdminAction;
import dev.pet.account.repository.AdminActionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AdminAuditService {
    private final AdminActionRepository repo;

    public AdminAuditService(AdminActionRepository repo) { this.repo = repo; }

    public void log(UUID adminId, String action, UUID targetUserId, String details, String ip) {
        var a = new AdminAction();
        a.setAdminId(adminId);
        a.setAction(action);
        a.setTargetUserId(targetUserId);
        a.setDetails(details);
        a.setIp(ip);
        repo.save(a);
    }

    public org.springframework.data.domain.Page<AdminAction> byAdmin(UUID adminId, int page, int size) {
        return repo.findByAdminIdOrderByCreatedAtDesc(adminId, PageRequest.of(page, size));
    }

    public org.springframework.data.domain.Page<AdminAction> byTarget(UUID targetUserId, int page, int size) {
        return repo.findByTargetUserIdOrderByCreatedAtDesc(targetUserId, PageRequest.of(page, size));
    }
}
