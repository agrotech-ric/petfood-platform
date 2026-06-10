package dev.pet.account.api;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/account/admin")
public class AdminController {

    @GetMapping("/probe")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> probe() {
        return Map.of("ok", "admin-only");
    }
}
