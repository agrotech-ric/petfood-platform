package dev.pet.account.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.Map;

public final class ActivityLogJson {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private ActivityLogJson() {}

    public static String profileUpdated(String description) {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("description", description != null ? description : "");
        return serialize(fields);
    }

    private static String serialize(Map<String, String> fields) {
        try {
            return MAPPER.writeValueAsString(fields);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize activity log", e);
        }
    }
}
