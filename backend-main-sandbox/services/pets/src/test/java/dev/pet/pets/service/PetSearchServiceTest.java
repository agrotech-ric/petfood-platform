package dev.pet.pets.service;

import dev.pet.pets.domain.Gender;
import dev.pet.pets.domain.Pet;
import dev.pet.pets.integration.AccountAuditClient;
import dev.pet.pets.repo.HealthConditionRepository;
import dev.pet.pets.repo.PetFavoriteRepository;
import dev.pet.pets.repo.PetRepository;
import dev.pet.pets.search.PetSearchDao;
import dev.pet.pets.search.PetSearchFilter;
import dev.pet.pets.search.PetSearchRow;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PetSearchServiceTest {

    @Test
    void mapsFavoriteFromSearchMetadataWhenBaseResponseValueIsNull() {
        PetSearchDao searchDao = mock(PetSearchDao.class);
        PetRepository pets = mock(PetRepository.class);
        PetSearchService service = new PetSearchService(
            searchDao,
            pets,
            mock(PetFavoriteRepository.class),
            mock(HealthConditionRepository.class),
            mock(AccountAuditClient.class)
        );

        UUID ownerId = UUID.randomUUID();
        UUID petId = UUID.randomUUID();
        Pet pet = new Pet();
        pet.setId(petId);
        pet.setOwnerId(ownerId);
        pet.setName("Fred");
        pet.setGender(Gender.male);

        PetSearchFilter filter = new PetSearchFilter();
        PageRequest pageable = PageRequest.of(0, 50);
        when(searchDao.search(ownerId, filter, 0, 50)).thenReturn(
            new PetSearchDao.SearchPage(List.of(new PetSearchRow(petId, true, false)), 1)
        );
        when(pets.findAllById(List.of(petId))).thenReturn(List.of(pet));

        var result = service.searchMine(jwt(ownerId), filter, pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).singleElement().satisfies(item -> {
            assertThat(item.getId()).isEqualTo(petId);
            assertThat(item.isFavorite()).isTrue();
            assertThat(item.isHasRecommendation()).isFalse();
        });
    }

    private Jwt jwt(UUID subject) {
        return new Jwt(
            "token",
            Instant.now(),
            Instant.now().plusSeconds(60),
            Map.of("alg", "none"),
            Map.of("sub", subject.toString())
        );
    }
}
