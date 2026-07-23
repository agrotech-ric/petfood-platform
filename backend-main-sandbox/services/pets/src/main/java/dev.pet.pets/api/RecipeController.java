package dev.pet.pets.api;

import dev.pet.pets.dto.RecipeListItemResponse;
import dev.pet.pets.dto.RecipeRequest;
import dev.pet.pets.dto.RecipeResponse;
import dev.pet.pets.service.RecipeService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/recipes")
public class RecipeController {

    private final RecipeService service;

    public RecipeController(RecipeService service) {
        this.service = service;
    }

    @GetMapping
    public List<RecipeListItemResponse> listMine(
        @AuthenticationPrincipal Jwt jwt,
        @RequestParam(required = false) String q,
        @RequestParam(required = false) List<String> types,
        @RequestParam(required = false) List<String> formats,
        @RequestParam(required = false) List<String> ageCategories,
        @RequestParam(required = false) List<String> breedSizes,
        @RequestParam(required = false) List<Long> reproductiveStatusIds,
        @RequestParam(required = false) List<Long> activityTypeIds,
        @RequestParam(required = false) List<Long> healthConditionIds,
        @RequestParam(required = false) List<Long> symptomIds,
        @RequestParam(required = false) List<Long> ingredientIds,
        @RequestParam(required = false) UUID petId,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "updatedAt") String sort,
        @RequestParam(defaultValue = "desc") String direction
    ) {
        return service.listMine(
            jwt,
            q,
            types,
            formats,
            ageCategories,
            breedSizes,
            reproductiveStatusIds,
            activityTypeIds,
            healthConditionIds,
            symptomIds,
            ingredientIds,
            petId,
            status,
            sort,
            direction
        );
    }

    @GetMapping("/{id}")
    public RecipeResponse getMine(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        return service.getMine(jwt, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RecipeResponse create(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody RecipeRequest request
    ) {
        return service.create(jwt, request);
    }

    @PatchMapping("/{id}")
    public RecipeResponse update(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable long id,
        @Valid @RequestBody RecipeRequest request
    ) {
        return service.update(jwt, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        service.delete(jwt, id);
    }
}
