package dev.pet.pets.api;

import dev.pet.pets.dto.ShareLinkResponse;
import dev.pet.pets.service.ResourceShareService;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ResourceShareController {
    private final ResourceShareService shareService;

    public ResourceShareController(ResourceShareService shareService) {
        this.shareService = shareService;
    }

    @GetMapping("/pets/{id}/share")
    public ShareLinkResponse getPetShare(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return shareService.getPetShare(jwt, id);
    }

    @PostMapping("/pets/{id}/share")
    public ShareLinkResponse createPetShare(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return shareService.createPetShare(jwt, id);
    }

    @PostMapping("/pets/{id}/share/rotate")
    public ShareLinkResponse rotatePetShare(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return shareService.rotatePetShare(jwt, id);
    }

    @DeleteMapping("/pets/{id}/share")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revokePetShare(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        shareService.revokePetShare(jwt, id);
    }

    @GetMapping("/recipes/{id}/share")
    public ShareLinkResponse getRecipeShare(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        return shareService.getRecipeShare(jwt, id);
    }

    @PostMapping("/recipes/{id}/share")
    public ShareLinkResponse createRecipeShare(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        return shareService.createRecipeShare(jwt, id);
    }

    @PostMapping("/recipes/{id}/share/rotate")
    public ShareLinkResponse rotateRecipeShare(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        return shareService.rotateRecipeShare(jwt, id);
    }

    @DeleteMapping("/recipes/{id}/share")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revokeRecipeShare(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        shareService.revokeRecipeShare(jwt, id);
    }
}
