package dev.pet.pets.api;

import dev.pet.pets.dto.PublicPetProfileResponse;
import dev.pet.pets.dto.PublicRecipeResponse;
import dev.pet.pets.error.ApiError;
import dev.pet.pets.error.NotFoundException;
import dev.pet.pets.service.PublicShareService;
import dev.pet.pets.service.StoredPhoto;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ExceptionHandler;

@RestController
@RequestMapping("/api/v1/public/shares")
public class PublicShareController {
    public static final String TOKEN_HEADER = "X-Share-Token";

    private final PublicShareService publicShareService;

    public PublicShareController(PublicShareService publicShareService) {
        this.publicShareService = publicShareService;
    }

    @GetMapping("/pet")
    public ResponseEntity<PublicPetProfileResponse> pet(@RequestHeader(value = TOKEN_HEADER, required = false) String token) {
        return publicResponse(publicShareService.pet(token));
    }

    @GetMapping("/recipe")
    public ResponseEntity<PublicRecipeResponse> recipe(@RequestHeader(value = TOKEN_HEADER, required = false) String token) {
        return publicResponse(publicShareService.recipe(token));
    }

    @GetMapping("/pet/photo")
    public ResponseEntity<byte[]> petPhoto(@RequestHeader(value = TOKEN_HEADER, required = false) String token) {
        return photoResponse(publicShareService.petPhoto(token));
    }

    @GetMapping("/recipe/pet-photo")
    public ResponseEntity<byte[]> recipePetPhoto(@RequestHeader(value = TOKEN_HEADER, required = false) String token) {
        return photoResponse(publicShareService.recipePetPhoto(token));
    }

    private <T> ResponseEntity<T> publicResponse(T body) {
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .header("Referrer-Policy", "no-referrer")
            .header("X-Robots-Tag", "noindex, nofollow")
            .body(body);
    }

    private ResponseEntity<byte[]> photoResponse(StoredPhoto photo) {
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .header("Referrer-Policy", "no-referrer")
            .header("X-Robots-Tag", "noindex, nofollow")
            .header(HttpHeaders.CONTENT_TYPE, photo.contentType() == null ? "application/octet-stream" : photo.contentType())
            .body(photo.bytes());
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiError> notFound(NotFoundException ignored) {
        return ResponseEntity.status(404)
            .cacheControl(CacheControl.noStore())
            .header("Referrer-Policy", "no-referrer")
            .header("X-Robots-Tag", "noindex, nofollow")
            .body(new ApiError("not_found", "Shared resource not found"));
    }
}
