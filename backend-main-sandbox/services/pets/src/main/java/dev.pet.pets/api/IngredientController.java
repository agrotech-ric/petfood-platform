package dev.pet.pets.api;

import dev.pet.pets.dto.IngredientRequest;
import dev.pet.pets.dto.IngredientResponse;
import dev.pet.pets.service.IngredientService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
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
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) List<String> nutrients,
        @RequestParam(defaultValue = "category") String sort,
        @RequestParam(defaultValue = "asc") String direction
    ) {
        return service.list(q, category, nutrients, sort, direction);
    }

    @GetMapping("/{id}")
    public IngredientResponse get(@PathVariable long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IngredientResponse create(@Valid @RequestBody IngredientRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}")
    public IngredientResponse update(@PathVariable long id, @Valid @RequestBody IngredientRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        service.delete(id);
    }
}
