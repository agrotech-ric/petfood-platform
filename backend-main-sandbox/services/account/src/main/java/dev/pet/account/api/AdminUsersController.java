package dev.pet.account.api;

import dev.pet.account.dto.AdminUpdateUserRequest;
import dev.pet.account.dto.AdminUserItemResponse;
import dev.pet.account.dto.PageResponse;
import dev.pet.account.service.AdminUserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/account/admin")
public class AdminUsersController {

    private final AdminUserService adminUsers;

    public AdminUsersController(AdminUserService adminUsers) {
        this.adminUsers = adminUsers;
    }

    @GetMapping("/users-directory")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<AdminUserItemResponse> usersDirectory(
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "desc") String order
    ) {
        return adminUsers.list(q, page, size, order);
    }

    @PatchMapping("/users-directory/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void updateUser(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable("id") UUID targetUserId,
        @RequestBody AdminUpdateUserRequest req
    ) {
        UUID actorId = UUID.fromString(jwt.getSubject());
        adminUsers.update(actorId, targetUserId, req);
    }
}
