package dev.pet.account.api;

import dev.pet.account.dto.AuditLogItemResponse;
import dev.pet.account.dto.CreateAuditLogRequest;
import dev.pet.account.dto.PageResponse;
import dev.pet.account.service.AuditLogService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/account")
public class AuditLogsController {

    private final AuditLogService logs;

    public AuditLogsController(AuditLogService logs) {
        this.logs = logs;
    }

    @PostMapping("/internal/audit/logs")
    @PreAuthorize("isAuthenticated()")
    public void create(@RequestBody CreateAuditLogRequest req) {
        logs.create(req);
    }

    @GetMapping("/admin/logs")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<AuditLogItemResponse> adminLogs(
        @RequestParam(required = false) UUID userId,
        @RequestParam(required = false) String eventType,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "desc") String order
    ) {
        return logs.adminList(userId, eventType, page, size, order);
    }

    @GetMapping("/admin/users/{userId}/logs")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<AuditLogItemResponse> adminUserLogs(
        @PathVariable UUID userId,
        @RequestParam(required = false) String eventType,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "desc") String order
    ) {
        return logs.adminList(userId, eventType, page, size, order);
    }
}
