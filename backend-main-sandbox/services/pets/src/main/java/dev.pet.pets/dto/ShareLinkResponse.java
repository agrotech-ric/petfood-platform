package dev.pet.pets.dto;

import java.time.OffsetDateTime;

public record ShareLinkResponse(
    boolean active,
    boolean available,
    String url,
    OffsetDateTime createdAt
) {
    public static ShareLinkResponse inactive() {
        return new ShareLinkResponse(false, false, null, null);
    }
}
