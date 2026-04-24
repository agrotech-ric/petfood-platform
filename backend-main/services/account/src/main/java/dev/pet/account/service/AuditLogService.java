package dev.pet.account.service;

import dev.pet.account.domain.AuditLog;
import dev.pet.account.dto.AuditLogItemResponse;
import dev.pet.account.dto.CreateAuditLogRequest;
import dev.pet.account.dto.PageResponse;
import dev.pet.account.repository.AuditLogRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class AuditLogService {

    private final AuditLogRepository repo;

    public AuditLogService(AuditLogRepository repo) {
        this.repo = repo;
    }

    public void create(CreateAuditLogRequest req) {
        if (req == null) throw new IllegalArgumentException("request is required");
        if (req.getUserId() == null) throw new IllegalArgumentException("userId is required");
        if (req.getEventType() == null || req.getEventType().isBlank()) throw new IllegalArgumentException("eventType is required");

        AuditLog e = new AuditLog();
        e.assignNewId();
        e.setUserId(req.getUserId());
        e.setEventType(req.getEventType().trim());
        e.setCreatedAt(OffsetDateTime.now());
        e.setEventInfo(req.getEventInfo());

        repo.save(e);
    }

    public PageResponse<AuditLogItemResponse> adminList(
        UUID userId,
        String eventType,
        int page,
        int size,
        String order
    ) {
        Sort sort = Sort.by("createdAt");
        sort = "asc".equalsIgnoreCase(order) ? sort.ascending() : sort.descending();

        Pageable pageable = PageRequest.of(Math.max(page, 0), clampSize(size), sort);

        boolean hasUser = userId != null;
        boolean hasType = eventType != null && !eventType.isBlank();

        Page<AuditLog> p;
        if (hasUser && hasType) {
            p = repo.findByUserIdAndEventType(userId, eventType.trim(), pageable);
        } else if (hasUser) {
            p = repo.findByUserId(userId, pageable);
        } else if (hasType) {
            p = repo.findByEventType(eventType.trim(), pageable);
        } else {
            p = repo.findAll(pageable);
        }

        var items = p.getContent().stream()
            .map(x -> new AuditLogItemResponse(
                x.getId(),
                x.getUserId(),
                x.getEventType(),
                x.getCreatedAt(),
                x.getEventInfo()
            ))
            .toList();

        return new PageResponse<>(items, p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }

    private int clampSize(int size) {
        if (size <= 0) return 20;
        return Math.min(size, 100);
    }
}
