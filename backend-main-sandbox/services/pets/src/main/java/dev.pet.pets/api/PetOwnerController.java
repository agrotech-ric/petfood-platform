package dev.pet.pets.api;

import dev.pet.pets.dto.CreatePetPhotoUploadUrlRequest;
import dev.pet.pets.dto.PetOwnerRecordRequest;
import dev.pet.pets.dto.PetOwnerRecordResponse;
import dev.pet.pets.dto.PetOwnerRequest;
import dev.pet.pets.dto.PetOwnerResponse;
import dev.pet.pets.dto.PetResponse;
import dev.pet.pets.dto.PresignedUrlResponse;
import dev.pet.pets.service.PetOwnerService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/pet-owners")
@PreAuthorize("hasAnyRole('USER', 'VET')")
public class PetOwnerController {
    private final PetOwnerService service;

    public PetOwnerController(PetOwnerService service) {
        this.service = service;
    }

    @GetMapping
    public List<PetOwnerResponse> search(@AuthenticationPrincipal Jwt jwt, @RequestParam(required = false) String q) {
        return service.search(jwt, q);
    }

    @PostMapping
    public PetOwnerResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody PetOwnerRequest request) {
        return service.create(jwt, request);
    }

    @GetMapping("/{ownerId}")
    public PetOwnerResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID ownerId) {
        return service.get(jwt, ownerId);
    }

    @PatchMapping("/{ownerId}")
    public PetOwnerResponse update(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID ownerId,
        @Valid @RequestBody PetOwnerRequest request
    ) {
        return service.update(jwt, ownerId, request);
    }

    @DeleteMapping("/{ownerId}")
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID ownerId) {
        service.delete(jwt, ownerId);
    }

    @GetMapping("/{ownerId}/pets")
    public List<PetResponse> pets(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID ownerId) {
        return service.listPets(jwt, ownerId);
    }

    @GetMapping("/unassigned-pets")
    public List<PetResponse> unassignedPets(@AuthenticationPrincipal Jwt jwt) {
        return service.listUnassignedPets(jwt);
    }

    @PostMapping("/{ownerId}/pets/{petId}")
    public PetResponse attachPet(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID ownerId,
        @PathVariable UUID petId
    ) {
        return service.attachPet(jwt, ownerId, petId);
    }

    @DeleteMapping("/{ownerId}/pets/{petId}")
    public PetResponse detachPet(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID ownerId,
        @PathVariable UUID petId
    ) {
        return service.detachPet(jwt, ownerId, petId);
    }

    @PostMapping("/{ownerId}/avatar/upload-url")
    public PresignedUrlResponse avatarUploadUrl(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID ownerId,
        @Valid @RequestBody CreatePetPhotoUploadUrlRequest request
    ) {
        return service.createAvatarUploadUrl(jwt, ownerId, request);
    }

    @GetMapping("/{ownerId}/avatar/download-url")
    public PresignedUrlResponse avatarDownloadUrl(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID ownerId) {
        return service.createAvatarDownloadUrl(jwt, ownerId);
    }

    @GetMapping("/{ownerId}/records")
    public List<PetOwnerRecordResponse> records(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID ownerId,
        @RequestParam(defaultValue = "active") String status
    ) {
        return service.listRecords(jwt, ownerId, status);
    }

    @PostMapping("/{ownerId}/records")
    public PetOwnerRecordResponse createRecord(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID ownerId,
        @Valid @RequestBody PetOwnerRecordRequest request
    ) {
        return service.createRecord(jwt, ownerId, request);
    }

    @GetMapping("/{ownerId}/records/{recordId}")
    public PetOwnerRecordResponse record(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID ownerId,
        @PathVariable UUID recordId
    ) {
        return service.getRecord(jwt, ownerId, recordId);
    }

    @PatchMapping("/{ownerId}/records/{recordId}")
    public PetOwnerRecordResponse updateRecord(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID ownerId,
        @PathVariable UUID recordId,
        @Valid @RequestBody PetOwnerRecordRequest request
    ) {
        return service.updateRecord(jwt, ownerId, recordId, request);
    }

    @PostMapping("/{ownerId}/records/{recordId}/archive")
    public PetOwnerRecordResponse archive(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID ownerId,
        @PathVariable UUID recordId
    ) {
        return service.archiveRecord(jwt, ownerId, recordId);
    }

    @PostMapping("/{ownerId}/records/{recordId}/restore")
    public PetOwnerRecordResponse restore(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID ownerId,
        @PathVariable UUID recordId
    ) {
        return service.restoreRecord(jwt, ownerId, recordId);
    }

    @DeleteMapping("/{ownerId}/records/{recordId}")
    public void deleteRecord(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID ownerId,
        @PathVariable UUID recordId
    ) {
        service.deleteRecord(jwt, ownerId, recordId);
    }

    @DeleteMapping("/{ownerId}/records/archive")
    public Map<String, Long> clearArchive(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID ownerId) {
        return Map.of("deleted", service.clearArchive(jwt, ownerId));
    }
}
