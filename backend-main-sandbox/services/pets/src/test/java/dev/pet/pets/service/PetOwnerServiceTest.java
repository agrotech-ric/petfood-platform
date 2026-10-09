package dev.pet.pets.service;

import dev.pet.pets.domain.Pet;
import dev.pet.pets.domain.Gender;
import dev.pet.pets.domain.PetOwner;
import dev.pet.pets.domain.PetOwnerRecord;
import dev.pet.pets.dto.PetOwnerRecordRequest;
import dev.pet.pets.dto.PetOwnerRequest;
import dev.pet.pets.error.ForbiddenOperationException;
import dev.pet.pets.repo.PetOwnerRecordRepository;
import dev.pet.pets.repo.PetOwnerRepository;
import dev.pet.pets.repo.PetFavoriteRepository;
import dev.pet.pets.repo.PetRepository;
import dev.pet.pets.mapper.PetMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PetOwnerServiceTest {
    private PetOwnerRepository owners;
    private PetOwnerRecordRepository records;
    private PetRepository pets;
    private PetFavoriteRepository favorites;
    private PetPhotoStorage photoStorage;
    private PetOwnerService service;

    @BeforeEach
    void setUp() {
        owners = mock(PetOwnerRepository.class);
        records = mock(PetOwnerRecordRepository.class);
        pets = mock(PetRepository.class);
        favorites = mock(PetFavoriteRepository.class);
        photoStorage = mock(PetPhotoStorage.class);
        service = new PetOwnerService(owners, records, pets, favorites, photoStorage);
        when(owners.save(any(PetOwner.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(records.save(any(PetOwnerRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void veterinarianCreatesStandaloneOwnerRecord() {
        PetOwnerRequest request = ownerRequest("  Александр А  ");

        var result = service.create(jwt("VET"), request);

        assertThat(result.id()).isNotNull();
        assertThat(result.fullName()).isEqualTo("Александр А");
        assertThat(result.email()).isEqualTo("owner@example.com");
        assertThat(result.placeholder()).isFalse();
        verify(owners).save(any(PetOwner.class));
    }

    @Test
    void standardUserCanReadOwnerRecords() {
        when(owners.search("")).thenReturn(java.util.List.of());

        assertThat(service.search(jwt("USER"), null)).isEmpty();
        verify(owners).search("");
    }

    @Test
    void anonymousCallerCannotReadOwnerRecords() {
        assertThatThrownBy(() -> service.search(null, null))
            .isInstanceOf(ForbiddenOperationException.class)
            .hasMessageContaining("authenticated platform");
        verify(owners, never()).search(any());
    }

    @Test
    void validatesSelectedChannelsAgainstOwnerContactData() {
        PetOwner owner = owner("Owner");
        when(owners.findById(owner.getId())).thenReturn(Optional.of(owner));
        PetOwnerRecordRequest request = recordRequest();
        request.setUseTelegram(true);

        assertThatThrownBy(() -> service.createRecord(jwt("VET"), owner.getId(), request))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Telegram");
        verify(records, never()).save(any());
    }

    @Test
    void storesRecordWithoutTriggeringAnyDeliveryIntegration() {
        PetOwner owner = owner("Owner");
        owner.setEmail("owner@example.com");
        when(owners.findById(owner.getId())).thenReturn(Optional.of(owner));
        PetOwnerRecordRequest request = recordRequest();
        request.setUseEmail(true);

        var result = service.createRecord(jwt("VET"), owner.getId(), request);

        assertThat(result.status()).isEqualTo("active");
        assertThat(result.useEmail()).isTrue();
        assertThat(result.email()).isEqualTo("owner@example.com");
        verify(records).save(any(PetOwnerRecord.class));
    }

    @Test
    void archiveLifecycleRequiresArchiveBeforeDeletion() {
        PetOwner owner = owner("Owner");
        PetOwnerRecord record = record(owner);
        when(records.findByIdAndOwner_Id(record.getId(), owner.getId())).thenReturn(Optional.of(record));

        assertThatThrownBy(() -> service.deleteRecord(jwt("VET"), owner.getId(), record.getId()))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("archived");

        var archived = service.archiveRecord(jwt("VET"), owner.getId(), record.getId());
        assertThat(archived.status()).isEqualTo("archived");
        assertThat(archived.archivedAt()).isNotNull();

        service.deleteRecord(jwt("VET"), owner.getId(), record.getId());
        verify(records).delete(record);
    }

    @Test
    void replacingAvatarDeletesPreviousObject() {
        PetOwner owner = owner("Owner");
        String previous = "pets/vet/owners/" + owner.getId() + "/old.jpg";
        String replacement = "pets/vet/owners/" + owner.getId() + "/new.jpg";
        owner.setAvatarObjectKey(previous);
        when(owners.findById(owner.getId())).thenReturn(Optional.of(owner));
        PetOwnerRequest request = ownerRequest("Owner");
        request.setAvatarObjectKey(replacement);

        service.update(jwt("VET"), owner.getId(), request);

        verify(photoStorage).delete(previous);
        assertThat(owner.getAvatarObjectKey()).isEqualTo(replacement);
    }

    @Test
    void rejectsAvatarKeysOutsideTheOwnerNamespace() {
        PetOwner owner = owner("Owner");
        when(owners.findById(owner.getId())).thenReturn(Optional.of(owner));
        PetOwnerRequest request = ownerRequest("Owner");
        request.setAvatarObjectKey("pets/vet/owners/" + owner.getId() + "/nested/avatar.jpg");

        assertThatThrownBy(() -> service.update(jwt("VET"), owner.getId(), request))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Invalid owner avatar key");
    }

    @Test
    void attachingPetReassignsItsCrmOwner() {
        PetOwner previous = owner("Previous");
        PetOwner next = owner("Next");
        Pet pet = new Pet();
        pet.setGender(Gender.male);
        pet.setPetOwner(previous);
        when(owners.findById(next.getId())).thenReturn(Optional.of(next));
        when(pets.findById(any())).thenReturn(Optional.of(pet));
        when(pets.save(pet)).thenReturn(pet);

        var result = service.attachPet(jwt("VET"), next.getId(), UUID.randomUUID());

        assertThat(pet.getPetOwner()).isSameAs(next);
        assertThat(result.getPetOwnerId()).isEqualTo(next.getId());
    }

    @Test
    void blocksOwnerDeletionWhileDependenciesExistAndScopesArchiveCleanup() {
        PetOwner owner = owner("Owner");
        when(owners.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(pets.countByPetOwner_Id(owner.getId())).thenReturn(1L);

        assertThatThrownBy(() -> service.delete(jwt("VET"), owner.getId()))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("linked pets");
        verify(owners, never()).delete(owner);

        when(records.deleteByOwner_IdAndStatus(owner.getId(), "archived")).thenReturn(2L);
        assertThat(service.clearArchive(jwt("VET"), owner.getId())).isEqualTo(2L);
        verify(records).deleteByOwner_IdAndStatus(owner.getId(), "archived");
    }

    @Test
    void nonVetPetResponseDoesNotExposeCrmOwner() {
        Pet pet = new Pet();
        pet.setGender(Gender.male);
        pet.setPetOwner(owner("Private contact"));

        assertThat(PetMapper.toDto(pet, false).getPetOwnerId()).isNull();
        assertThat(PetMapper.toDto(pet, false).getPetOwner()).isNull();
        assertThat(PetMapper.toDto(pet, true).getPetOwner()).isNotNull();
    }

    private PetOwnerRequest ownerRequest(String name) {
        PetOwnerRequest request = new PetOwnerRequest();
        request.setFullName(name);
        request.setEmail("OWNER@EXAMPLE.COM");
        request.setPhone("+77055555555");
        request.setTelegram("@owner_test");
        return request;
    }

    private PetOwnerRecordRequest recordRequest() {
        PetOwnerRecordRequest request = new PetOwnerRecordRequest();
        request.setTopic("Повторный прием");
        request.setRecordDate(LocalDate.now().plusDays(1));
        request.setRecordTime(LocalTime.of(12, 0));
        request.setMessage("Прийти на повторный прием");
        return request;
    }

    private PetOwner owner(String name) {
        PetOwner owner = new PetOwner();
        owner.assignNewId();
        owner.setFullName(name);
        return owner;
    }

    private PetOwnerRecord record(PetOwner owner) {
        PetOwnerRecord record = new PetOwnerRecord();
        record.assignNewId();
        record.setOwner(owner);
        record.setTopic("Topic");
        record.setRecordDate(LocalDate.now());
        record.setRecordTime(LocalTime.NOON);
        record.setMessage("Message");
        return record;
    }

    private Jwt jwt(String role) {
        return new Jwt(
            "token",
            Instant.now(),
            Instant.now().plusSeconds(60),
            Map.of("alg", "none"),
            Map.of("sub", UUID.randomUUID().toString(), "role", role)
        );
    }
}
