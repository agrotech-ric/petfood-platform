package dev.pet.pets.dto;

import java.util.List;
import java.util.UUID;

public record PetContraindicationsResponse(
    UUID petId,
    List<String> ingredients,
    String description
) {}
