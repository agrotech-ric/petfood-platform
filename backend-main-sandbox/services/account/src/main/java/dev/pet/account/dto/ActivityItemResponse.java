package dev.pet.account.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class ActivityItemResponse {
    private UUID id;
    private OffsetDateTime createdAt;
    private String eventType;
    private String description;

    public ActivityItemResponse(UUID id, OffsetDateTime createdAt, String eventType, String description) {
        this.id = id;
        this.createdAt = createdAt;
        this.eventType = eventType;
        this.description = description != null ? description : "";
    }

    public UUID getId() { return id; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public String getEventType() { return eventType; }
    public String getDescription() { return description; }
}
