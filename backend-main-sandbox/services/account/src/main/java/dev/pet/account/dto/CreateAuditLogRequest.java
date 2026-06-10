package dev.pet.account.dto;

import java.util.UUID;

public class CreateAuditLogRequest {
    private UUID userId;
    private String eventType;
    private String eventInfo;

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getEventInfo() { return eventInfo; }
    public void setEventInfo(String eventInfo) { this.eventInfo = eventInfo; }
}
