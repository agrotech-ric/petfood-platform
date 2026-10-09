package dev.pet.pets.service;

import dev.pet.pets.domain.Pet;
import dev.pet.pets.domain.PetOwner;
import dev.pet.pets.domain.PetOwnerRecord;
import dev.pet.pets.dto.CreatePetPhotoUploadUrlRequest;
import dev.pet.pets.dto.PetOwnerRecordRequest;
import dev.pet.pets.dto.PetOwnerRecordResponse;
import dev.pet.pets.dto.PetOwnerRequest;
import dev.pet.pets.dto.PetOwnerResponse;
import dev.pet.pets.dto.PetResponse;
import dev.pet.pets.dto.PresignedUrlResponse;
import dev.pet.pets.error.ForbiddenOperationException;
import dev.pet.pets.error.NotFoundException;
import dev.pet.pets.mapper.PetMapper;
import dev.pet.pets.repo.PetOwnerRecordRepository;
import dev.pet.pets.repo.PetOwnerRepository;
import dev.pet.pets.repo.PetFavoriteRepository;
import dev.pet.pets.repo.PetRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class PetOwnerService {
    private final PetOwnerRepository owners;
    private final PetOwnerRecordRepository records;
    private final PetRepository pets;
    private final PetFavoriteRepository favorites;
    private final PetPhotoStorage photoStorage;

    public PetOwnerService(
        PetOwnerRepository owners,
        PetOwnerRecordRepository records,
        PetRepository pets,
        PetFavoriteRepository favorites,
        PetPhotoStorage photoStorage
    ) {
        this.owners = owners;
        this.records = records;
        this.pets = pets;
        this.favorites = favorites;
        this.photoStorage = photoStorage;
    }

    @Transactional(readOnly = true)
    public List<PetOwnerResponse> search(Jwt jwt, String query) {
        requireVet(jwt);
        String q = query == null ? "" : query.trim();
        return owners.search(q).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PetOwnerResponse get(Jwt jwt, UUID ownerId) {
        requireVet(jwt);
        return toResponse(requireOwner(ownerId));
    }

    @Transactional
    public PetOwnerResponse create(Jwt jwt, PetOwnerRequest request) {
        requireVet(jwt);
        PetOwner owner = new PetOwner();
        owner.assignNewId();
        apply(owner, request);
        return toResponse(owners.save(owner));
    }

    @Transactional
    public PetOwnerResponse update(Jwt jwt, UUID ownerId, PetOwnerRequest request) {
        requireVet(jwt);
        PetOwner owner = requireOwner(ownerId);
        apply(owner, request);
        return toResponse(owners.save(owner));
    }

    @Transactional
    public void delete(Jwt jwt, UUID ownerId) {
        requireVet(jwt);
        PetOwner owner = requireOwner(ownerId);
        long petCount = pets.countByPetOwner_Id(ownerId);
        long activeCount = records.countByOwner_IdAndStatus(ownerId, "active");
        if (petCount > 0 || activeCount > 0) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Owner has linked pets or active records"
            );
        }
        if (owner.getAvatarObjectKey() != null) {
            photoStorage.delete(owner.getAvatarObjectKey());
        }
        owners.delete(owner);
    }

    @Transactional(readOnly = true)
    public List<PetResponse> listPets(Jwt jwt, UUID ownerId) {
        requireVet(jwt);
        requireOwner(ownerId);
        return pets.findByPetOwner_IdOrderByNameAsc(ownerId).stream()
            .map(pet -> {
                PetResponse response = PetMapper.toDto(pet, true);
                response.setFavorite(favorites.existsByIdOwnerIdAndIdPetId(pet.getOwnerId(), pet.getId()));
                return response;
            })
            .toList();
    }

    @Transactional(readOnly = true)
    public List<PetResponse> listUnassignedPets(Jwt jwt) {
        requireVet(jwt);
        return pets.findByPetOwnerIsNullOrderByNameAsc().stream()
            .map(pet -> PetMapper.toDto(pet, true))
            .toList();
    }

    @Transactional
    public PetResponse attachPet(Jwt jwt, UUID ownerId, UUID petId) {
        requireVet(jwt);
        PetOwner owner = requireOwner(ownerId);
        Pet pet = pets.findById(petId).orElseThrow(() -> new NotFoundException("pet not found"));
        pet.setPetOwner(owner);
        return PetMapper.toDto(pets.save(pet), true);
    }

    @Transactional
    public PetResponse detachPet(Jwt jwt, UUID ownerId, UUID petId) {
        requireVet(jwt);
        Pet pet = pets.findById(petId).orElseThrow(() -> new NotFoundException("pet not found"));
        if (pet.getPetOwner() == null || !ownerId.equals(pet.getPetOwner().getId())) {
            throw new NotFoundException("pet is not linked to this owner");
        }
        pet.setPetOwner(null);
        return PetMapper.toDto(pets.save(pet), true);
    }

    public PresignedUrlResponse createAvatarUploadUrl(
        Jwt jwt,
        UUID ownerId,
        CreatePetPhotoUploadUrlRequest request
    ) {
        requireVet(jwt);
        requireOwner(ownerId);
        validatePhotoContentType(request.getContentType());
        String extension = "image/png".equalsIgnoreCase(request.getContentType()) ? ".png" : ".jpg";
        String key = "pets/" + jwt.getSubject() + "/owners/" + ownerId + "/" + UUID.randomUUID() + extension;
        return new PresignedUrlResponse(
            photoStorage.generateUploadUrl(key, request.getContentType()),
            key
        );
    }

    public PresignedUrlResponse createAvatarDownloadUrl(Jwt jwt, UUID ownerId) {
        requireVet(jwt);
        PetOwner owner = requireOwner(ownerId);
        String key = owner.getAvatarObjectKey();
        if (key == null || key.isBlank() || !key.contains("/owners/" + ownerId + "/")) {
            throw new NotFoundException("owner avatar not found");
        }
        return new PresignedUrlResponse(photoStorage.generateDownloadUrl(key), key);
    }

    @Transactional(readOnly = true)
    public List<PetOwnerRecordResponse> listRecords(Jwt jwt, UUID ownerId, String status) {
        requireVet(jwt);
        requireOwner(ownerId);
        String normalized = normalizeStatus(status);
        return records.findByOwner_IdAndStatusOrderByRecordDateAscRecordTimeAsc(ownerId, normalized)
            .stream().map(this::toRecordResponse).toList();
    }

    @Transactional(readOnly = true)
    public PetOwnerRecordResponse getRecord(Jwt jwt, UUID ownerId, UUID recordId) {
        requireVet(jwt);
        return toRecordResponse(requireRecord(ownerId, recordId));
    }

    @Transactional
    public PetOwnerRecordResponse createRecord(Jwt jwt, UUID ownerId, PetOwnerRecordRequest request) {
        requireVet(jwt);
        PetOwner owner = requireOwner(ownerId);
        validateChannels(owner, request);
        PetOwnerRecord record = new PetOwnerRecord();
        record.assignNewId();
        record.setOwner(owner);
        applyRecord(record, request);
        return toRecordResponse(records.save(record));
    }

    @Transactional
    public PetOwnerRecordResponse updateRecord(
        Jwt jwt,
        UUID ownerId,
        UUID recordId,
        PetOwnerRecordRequest request
    ) {
        requireVet(jwt);
        PetOwnerRecord record = requireRecord(ownerId, recordId);
        if (!"active".equals(record.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Archived records must be restored before editing");
        }
        validateChannels(record.getOwner(), request);
        applyRecord(record, request);
        return toRecordResponse(records.save(record));
    }

    @Transactional
    public PetOwnerRecordResponse archiveRecord(Jwt jwt, UUID ownerId, UUID recordId) {
        requireVet(jwt);
        PetOwnerRecord record = requireRecord(ownerId, recordId);
        record.setStatus("archived");
        record.setArchivedAt(OffsetDateTime.now());
        return toRecordResponse(records.save(record));
    }

    @Transactional
    public PetOwnerRecordResponse restoreRecord(Jwt jwt, UUID ownerId, UUID recordId) {
        requireVet(jwt);
        PetOwnerRecord record = requireRecord(ownerId, recordId);
        record.setStatus("active");
        record.setArchivedAt(null);
        return toRecordResponse(records.save(record));
    }

    @Transactional
    public void deleteRecord(Jwt jwt, UUID ownerId, UUID recordId) {
        requireVet(jwt);
        PetOwnerRecord record = requireRecord(ownerId, recordId);
        if (!"archived".equals(record.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only archived records can be deleted");
        }
        records.delete(record);
    }

    @Transactional
    public long clearArchive(Jwt jwt, UUID ownerId) {
        requireVet(jwt);
        requireOwner(ownerId);
        return records.deleteByOwner_IdAndStatus(ownerId, "archived");
    }

    private PetOwner requireOwner(UUID id) {
        return owners.findById(id).orElseThrow(() -> new NotFoundException("owner not found"));
    }

    private PetOwnerRecord requireRecord(UUID ownerId, UUID recordId) {
        return records.findByIdAndOwner_Id(recordId, ownerId)
            .orElseThrow(() -> new NotFoundException("owner record not found"));
    }

    private void apply(PetOwner owner, PetOwnerRequest request) {
        owner.setFullName(cleanRequired(request.getFullName()));
        owner.setCountry(clean(request.getCountry()));
        owner.setCity(clean(request.getCity()));
        owner.setAddress(clean(request.getAddress()));
        owner.setPhone(clean(request.getPhone()));
        owner.setEmail(lower(request.getEmail()));
        owner.setTelegram(clean(request.getTelegram()));
        if (request.getAvatarObjectKey() != null) {
            String key = clean(request.getAvatarObjectKey());
            if (key != null && !key.matches("^pets/[^/]+/owners/" + owner.getId() + "/[^/]+$")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid owner avatar key");
            }
            String previousKey = owner.getAvatarObjectKey();
            if (previousKey != null && !previousKey.equals(key)) {
                photoStorage.delete(previousKey);
            }
            owner.setAvatarObjectKey(key);
        }
        owner.setPlaceholder(false);
    }

    private void applyRecord(PetOwnerRecord record, PetOwnerRecordRequest request) {
        record.setTopic(cleanRequired(request.getTopic()));
        record.setRecordDate(request.getRecordDate());
        record.setRecordTime(request.getRecordTime());
        record.setMessage(cleanRequired(request.getMessage()));
        record.setUseEmail(request.isUseEmail());
        record.setUseSms(request.isUseSms());
        record.setUseTelegram(request.isUseTelegram());
    }

    private void validateChannels(PetOwner owner, PetOwnerRecordRequest request) {
        if (!request.isUseEmail() && !request.isUseSms() && !request.isUseTelegram()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one channel");
        }
        if (request.isUseEmail() && clean(owner.getEmail()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner email is required");
        }
        if (request.isUseSms() && clean(owner.getPhone()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner phone is required");
        }
        if (request.isUseTelegram() && clean(owner.getTelegram()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner Telegram handle is required");
        }
    }

    private PetOwnerResponse toResponse(PetOwner owner) {
        return new PetOwnerResponse(
            owner.getId(), owner.getFullName(), owner.getCountry(), owner.getCity(), owner.getAddress(),
            owner.getPhone(), owner.getEmail(), owner.getTelegram(), owner.getAvatarObjectKey(),
            owner.isPlaceholder(), pets.countByPetOwner_Id(owner.getId()),
            records.countByOwner_IdAndStatus(owner.getId(), "active"), owner.getCreatedAt(), owner.getUpdatedAt()
        );
    }

    private PetOwnerRecordResponse toRecordResponse(PetOwnerRecord record) {
        PetOwner owner = record.getOwner();
        return new PetOwnerRecordResponse(
            record.getId(), owner.getId(), owner.getFullName(), record.getTopic(), record.getRecordDate(),
            record.getRecordTime(), record.getMessage(), record.isUseEmail(), record.isUseSms(),
            record.isUseTelegram(), owner.getEmail(), owner.getPhone(), owner.getTelegram(),
            record.getStatus(), record.getArchivedAt(), record.getCreatedAt(), record.getUpdatedAt()
        );
    }

    private String normalizeStatus(String status) {
        String value = status == null ? "active" : status.trim().toLowerCase(Locale.ROOT);
        if (!value.equals("active") && !value.equals("archived")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status must be active or archived");
        }
        return value;
    }

    private String cleanRequired(String value) {
        String cleaned = clean(value);
        if (cleaned == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Required value is blank");
        return cleaned;
    }

    private String clean(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private String lower(String value) {
        String cleaned = clean(value);
        return cleaned == null ? null : cleaned.toLowerCase(Locale.ROOT);
    }

    private void validatePhotoContentType(String contentType) {
        if (!"image/jpeg".equalsIgnoreCase(contentType) && !"image/png".equalsIgnoreCase(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPEG and PNG photos are supported");
        }
    }

    private void requireVet(Jwt jwt) {
        if (jwt == null) throw new ForbiddenOperationException("authenticated platform role required");
        Object role = jwt.getClaims().get("role");
        if (role instanceof String value && isPlatformRole(value)) return;
        if (role instanceof java.util.Collection<?> values && values.stream().anyMatch(
            value -> value instanceof String text && isPlatformRole(text)
        )) return;
        throw new ForbiddenOperationException("authenticated platform role required");
    }

    private boolean isPlatformRole(String role) {
        String normalized = role.toLowerCase(Locale.ROOT);
        return normalized.contains("user") || normalized.contains("vet") || normalized.contains("veterinarian");
    }
}
