package dev.pet.pets.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.pet.pets.domain.ActivityType;
import dev.pet.pets.domain.Pet;

import java.time.LocalDate;
import java.time.Period;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public final class ActivityLogJson {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private ActivityLogJson() {}

    public static String petEvent(Pet pet, ActivityType activityType) {
        Map<String, String> fields = basePetFields(pet);
        fields.put("description", buildPetDescription(pet, activityType != null ? activityType.getName() : null));
        return serialize(fields);
    }

    public static String petEvent(Pet pet) {
        return petEvent(pet, null);
    }

    public static String profileEvent(String description) {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("description", description != null ? description : "");
        return serialize(fields);
    }

    private static Map<String, String> basePetFields(Pet pet) {
        Map<String, String> fields = new LinkedHashMap<>();
        if (pet.getId() != null) {
            fields.put("petId", pet.getId().toString());
        }
        if (pet.getName() != null) {
            fields.put("petName", pet.getName());
        }
        return fields;
    }

    static String buildPetDescription(Pet pet, String activityName) {
        String name = pet.getName() != null ? pet.getName().trim() : "";
        String age = formatAge(pet.getBirthDate());
        String breed = pet.getBreed() != null && pet.getBreed().getNameRu() != null
            ? pet.getBreed().getNameRu().trim()
            : "";

        return Stream.of(name, age, breed, activityName)
            .filter(part -> part != null && !part.isBlank())
            .collect(Collectors.joining(" / "));
    }

    static String formatAge(LocalDate birthDate) {
        if (birthDate == null) {
            return "";
        }
        int years = Period.between(birthDate, LocalDate.now()).getYears();
        if (years <= 0) {
            return "< 1 года";
        }
        int mod10 = years % 10;
        int mod100 = years % 100;
        String suffix;
        if (mod10 == 1 && mod100 != 11) {
            suffix = "год";
        } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
            suffix = "года";
        } else {
            suffix = "лет";
        }
        return years + " " + suffix;
    }

    private static String serialize(Map<String, String> fields) {
        try {
            return MAPPER.writeValueAsString(fields);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize activity log", e);
        }
    }
}
