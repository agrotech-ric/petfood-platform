package dev.pet.pets.api;

import dev.pet.pets.dto.IngredientRequest;
import dev.pet.pets.dto.IngredientResponse;
import dev.pet.pets.service.IngredientService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ingredients")
public class IngredientController {

    private final IngredientService service;

    public IngredientController(IngredientService service) {
        this.service = service;
    }

    @GetMapping
    public List<IngredientResponse> list(
        @AuthenticationPrincipal Jwt jwt,
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) List<String> nutrients,
        @RequestParam(defaultValue = "all") String source,
        @RequestParam(defaultValue = "category") String sort,
        @RequestParam(defaultValue = "asc") String direction
    ) {
        return service.list(jwt, q, category, nutrients, source, sort, direction);
    }

    @GetMapping("/{id}")
    public IngredientResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        return service.get(jwt, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IngredientResponse create(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody IngredientRequest request
    ) {
        return service.create(jwt, request);
    }

    @PatchMapping("/{id}")
    public IngredientResponse update(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable long id,
        @Valid @RequestBody IngredientRequest request
    ) {
        return service.update(jwt, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        service.delete(jwt, id);
    }
}
