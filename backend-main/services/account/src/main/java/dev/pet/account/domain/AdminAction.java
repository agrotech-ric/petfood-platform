package dev.pet.account.domain;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "admin_actions")
public class AdminAction {

    @Id @GeneratedValue
    private UUID id;

    @Column(name = "created_at", nullable = false, updatable = false)
    private java.time.OffsetDateTime createdAt = java.time.OffsetDateTime.now();

    @Column(name = "admin_id", nullable = false)
    private UUID adminId;

    @Column(name = "action", nullable = false)
    private String action;

    @Column(name = "target_user_id")
    private UUID targetUserId;

    @Column(name = "details")
    private String details;

    @Column(name = "ip", length = 64)
    private String ip;

    // getters/setters
    public UUID getId() { return id; }
    public java.time.OffsetDateTime getCreatedAt() { return createdAt; }
    public UUID getAdminId() { return adminId; }
    public void setAdminId(UUID adminId) { this.adminId = adminId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public UUID getTargetUserId() { return targetUserId; }
    public void setTargetUserId(UUID targetUserId) { this.targetUserId = targetUserId; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }
}
