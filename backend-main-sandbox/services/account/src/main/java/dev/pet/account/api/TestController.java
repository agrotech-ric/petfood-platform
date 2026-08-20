package dev.pet.account.api;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class TestController {
    @GetMapping("/test")
    public Map<String, Object> test(HttpServletRequest req) {
        String auth = req.getHeader("Authorization");
        return Map.of(
            "auth_header", auth == null ? "" : auth,
            "has_jwt", auth != null && auth.startsWith("Bearer ")
        );
    }
}
