package dev.pet.account.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class AuditLogItemResponse {
    private UUID id;
    private UUID userId;
    private String eventType;
    private OffsetDateTime createdAt;
    private String eventInfo;

    public AuditLogItemResponse(
        UUID id,
        UUID userId,
        String eventType,
        OffsetDateTime createdAt,
        String eventInfo
    ) {
        this.id = id;
        this.userId = userId;
        this.eventType = eventType;
        this.createdAt = createdAt;
        this.eventInfo = eventInfo;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getEventType() { return eventType; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public String getEventInfo() { return eventInfo; }
}
