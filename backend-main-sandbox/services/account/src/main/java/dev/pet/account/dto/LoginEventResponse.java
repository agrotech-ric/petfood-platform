package dev.pet.account.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LoginEventResponse(
    UUID id,
    OffsetDateTime at,
    String ip,
    String userAgent,
    boolean success
) {}
