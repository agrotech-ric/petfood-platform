package dev.pet.pets.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

public record PetOwnerRecordResponse(
    UUID id,
    UUID ownerId,
    String ownerName,
    String topic,
    LocalDate recordDate,
    LocalTime recordTime,
    String message,
    boolean useEmail,
    boolean useSms,
    boolean useTelegram,
    String email,
    String phone,
    String telegram,
    String status,
    OffsetDateTime archivedAt,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
