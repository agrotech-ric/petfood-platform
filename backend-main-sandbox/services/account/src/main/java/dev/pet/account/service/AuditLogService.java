package dev.pet.account.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.pet.account.domain.AuditLog;
import dev.pet.account.dto.ActivityItemResponse;
import dev.pet.account.dto.AuditLogItemResponse;
import dev.pet.account.dto.CreateAuditLogRequest;
import dev.pet.account.dto.PageResponse;
import dev.pet.account.repository.AuditLogRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AuditLogService {

    private static final List<String> PROFILE_HIDDEN_EVENTS = List.of("LOGIN");

    private final AuditLogRepository repo;
    private final ObjectMapper objectMapper;

    public AuditLogService(AuditLogRepository repo, ObjectMapper objectMapper) {
        this.repo = repo;
        this.objectMapper = objectMapper;
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

    public PageResponse<ActivityItemResponse> myActivity(UUID userId, int page, int size) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(Math.max(page, 0), clampSize(size), sort);
        Page<AuditLog> p = repo.findByUserIdAndEventTypeNotIn(userId, PROFILE_HIDDEN_EVENTS, pageable);

        var items = p.getContent().stream()
            .map(x -> new ActivityItemResponse(
                x.getId(),
                x.getCreatedAt(),
                x.getEventType(),
                extractDescription(x.getEventInfo())
            ))
            .toList();

        return new PageResponse<>(items, p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
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

    private String extractDescription(String eventInfo) {
        if (eventInfo == null || eventInfo.isBlank()) {
            return "";
        }
        try {
            JsonNode node = objectMapper.readTree(eventInfo);
            if (node.hasNonNull("description")) {
                return node.get("description").asText("");
            }
        } catch (Exception ignored) {
            // legacy rows without JSON description
        }
        return "";
    }

    private int clampSize(int size) {
        if (size <= 0) return 20;
        return Math.min(size, 100);
    }
}
