package dev.pet.account.dto;

import java.util.Set;

public record AdminRolesRequest(Set<String> roles) {}
