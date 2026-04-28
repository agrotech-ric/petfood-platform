package dev.pet.account.service;

import dev.pet.account.domain.Role;
import dev.pet.account.domain.User;
import dev.pet.account.dto.AdminUpdateUserRequest;
import dev.pet.account.dto.AdminUserItemResponse;
import dev.pet.account.dto.PageResponse;
import dev.pet.account.repository.UserRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class AdminUserService {

    private final UserRepository users;

    public AdminUserService(UserRepository users) {
        this.users = users;
    }

    public PageResponse<AdminUserItemResponse> list(String q, int page, int size, String order) {
        Sort sort = Sort.by("createdAt");
        sort = "asc".equalsIgnoreCase(order) ? sort.ascending() : sort.descending();

        Pageable pageable = PageRequest.of(Math.max(page, 0), clampSize(size), sort);

        Page<User> p;
        if (q == null || q.isBlank()) {
            p = users.findAll(pageable);
        } else {
            p = users.adminDirectorySearch(q.trim(), pageable);
        }

        var items = p.getContent().stream()
            .map(u -> new AdminUserItemResponse(
                u.getId(),
                u.getEmail(),
                fullName(u),
                u.getIin(),
                u.getRole() == null ? "" : u.getRole().name(),
                u.getCreatedAt(),
                u.getRole() != Role.ADMIN
            ))
            .toList();

        return new PageResponse<>(items, p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
    }

    public void update(UUID actorAdminId, UUID targetUserId, AdminUpdateUserRequest req) {
        if (actorAdminId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "unauthorized");
        if (targetUserId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "target user id is required");
        if (actorAdminId.equals(targetUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "cannot_modify_self");
        }

        var u = users.findById(targetUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));

        if (u.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "cannot_modify_admin");
        }

        if (req == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request is required");
        }

        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            String normalized = req.getEmail().trim().toLowerCase();
            if (!normalized.equals(u.getEmail()) && users.existsByEmail(normalized)) {
                throw new DuplicateKeyException("Email already registered");
            }
            u.setEmail(normalized);
        }

        if (req.getRole() != null && !req.getRole().isBlank()) {
            String raw = req.getRole().trim().toUpperCase();
            Role newRole;
            try {
                newRole = Role.valueOf(raw);
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown role: " + req.getRole());
            }

            if (newRole == Role.ADMIN) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "cannot_promote_to_admin");
            }

            u.setRole(newRole);
        }

        users.save(u);
    }

    private String fullName(User u) {
        String fn = u.getFirstName() == null ? "" : u.getFirstName();
        String ln = u.getLastName() == null ? "" : u.getLastName();
        String out = (fn + " " + ln).trim();
        return out.isEmpty() ? "" : out;
    }

    private int clampSize(int size) {
        if (size <= 0) return 20;
        return Math.min(size, 100);
    }
}
