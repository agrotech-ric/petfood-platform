package dev.pet.account.api;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/account/_debug")
public class DebugAuthController {


    @GetMapping("/whoami-secure")
    public Map<String, Object> whoamiSecure(@AuthenticationPrincipal Jwt jwt, Authentication auth) {
        if (jwt == null || auth == null || !auth.isAuthenticated()) {
            return Map.of("authenticated", false);
        }
        return Map.of(
            "svc", "account",
            "authenticated", auth != null && auth.isAuthenticated(),
            "sub", jwt.getSubject(),
            "role_claim", jwt.getClaim("role"),
            "authorities", auth.getAuthorities().toString(),
            "iss", jwt.getIssuer() == null ? "" : jwt.getIssuer().toString(),
            "exp", jwt.getExpiresAt() == null ? null : jwt.getExpiresAt().toString(),
            "iat", jwt.getIssuedAt() == null ? null : jwt.getIssuedAt().toString()
        );
    }
}
