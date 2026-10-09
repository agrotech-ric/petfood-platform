package dev.pet.pets.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "pet_owner_records", schema = "pets")
public class PetOwnerRecord {
    @Id
    @Column(nullable = false)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_owner_id", nullable = false)
    private PetOwner owner;

    @Column(nullable = false, length = 200)
    private String topic;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Column(name = "record_time", nullable = false)
    private LocalTime recordTime;

    @Column(nullable = false, columnDefinition = "text")
    private String message;

    @Column(name = "use_email", nullable = false)
    private boolean useEmail;

    @Column(name = "use_sms", nullable = false)
    private boolean useSms;

    @Column(name = "use_telegram", nullable = false)
    private boolean useTelegram;

    @Column(nullable = false, length = 16)
    private String status = "active";

    @Column(name = "archived_at")
    private OffsetDateTime archivedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public void assignNewId() { if (id == null) id = UUID.randomUUID(); }
    public UUID getId() { return id; }
    public PetOwner getOwner() { return owner; }
    public void setOwner(PetOwner owner) { this.owner = owner; }
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    public LocalDate getRecordDate() { return recordDate; }
    public void setRecordDate(LocalDate recordDate) { this.recordDate = recordDate; }
    public LocalTime getRecordTime() { return recordTime; }
    public void setRecordTime(LocalTime recordTime) { this.recordTime = recordTime; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public boolean isUseEmail() { return useEmail; }
    public void setUseEmail(boolean useEmail) { this.useEmail = useEmail; }
    public boolean isUseSms() { return useSms; }
    public void setUseSms(boolean useSms) { this.useSms = useSms; }
    public boolean isUseTelegram() { return useTelegram; }
    public void setUseTelegram(boolean useTelegram) { this.useTelegram = useTelegram; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getArchivedAt() { return archivedAt; }
    public void setArchivedAt(OffsetDateTime archivedAt) { this.archivedAt = archivedAt; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
