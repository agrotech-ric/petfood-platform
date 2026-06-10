package dev.pet.pets.service;

import dev.pet.pets.domain.Pet;
import dev.pet.pets.domain.PetFavorite;
import dev.pet.pets.domain.PetFavoriteId;
import dev.pet.pets.dto.HealthConditionItem;
import dev.pet.pets.dto.PetListItemResponse;
import dev.pet.pets.error.ForbiddenOperationException;
import org.springframework.beans.BeanUtils;
import dev.pet.pets.error.NotFoundException;
import dev.pet.pets.mapper.PetMapper;
import dev.pet.pets.repo.HealthConditionRepository;
import dev.pet.pets.repo.PetFavoriteRepository;
import dev.pet.pets.repo.PetRepository;
import dev.pet.pets.search.PetSearchDao;
import dev.pet.pets.search.PetSearchFilter;
import dev.pet.pets.search.PetSearchRow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PetSearchService {

    private final PetSearchDao searchDao;
    private final PetRepository pets;
    private final PetFavoriteRepository favorites;
    private final HealthConditionRepository healthConditions;

    public PetSearchService(
        PetSearchDao searchDao,
        PetRepository pets,
        PetFavoriteRepository favorites,
        HealthConditionRepository healthConditions
    ) {
        this.searchDao = searchDao;
        this.pets = pets;
        this.favorites = favorites;
        this.healthConditions = healthConditions;
    }

    @Transactional(readOnly = true)
    public Page<PetListItemResponse> searchMine(Jwt jwt, PetSearchFilter filter, Pageable pageable) {
        UUID ownerId = UUID.fromString(jwt.getSubject());
        PetSearchDao.SearchPage result = searchDao.search(
            ownerId,
            filter,
            pageable.getPageNumber(),
            pageable.getPageSize()
        );

        if (result.rows().isEmpty()) {
            return new PageImpl<>(List.of(), pageable, result.totalElements());
        }

        List<UUID> orderedIds = result.rows().stream().map(PetSearchRow::getPetId).toList();
        Map<UUID, Pet> petById = pets.findAllById(orderedIds).stream()
            .collect(Collectors.toMap(Pet::getId, Function.identity()));

        Map<UUID, PetSearchRow> meta = result.rows().stream()
            .collect(Collectors.toMap(PetSearchRow::getPetId, r -> r, (a, b) -> a));

        List<PetListItemResponse> content = orderedIds.stream()
            .map(petById::get)
            .filter(Objects::nonNull)
            .map(p -> toListItem(p, meta.get(p.getId())))
            .toList();

        return new PageImpl<>(content, pageable, result.totalElements());
    }

    @Transactional(readOnly = true)
    public List<HealthConditionItem> listHealthConditions() {
        return healthConditions.findAll().stream()
            .map(h -> new HealthConditionItem(h.getId(), h.getCode(), h.getNameRu()))
            .sorted(Comparator.comparing(HealthConditionItem::getNameRu))
            .toList();
    }

    @Transactional
    public void addFavorite(Jwt jwt, UUID petId) {
        UUID ownerId = UUID.fromString(jwt.getSubject());
        Pet pet = pets.findById(petId).orElseThrow(() -> new NotFoundException("pet not found"));
        if (!ownerId.equals(pet.getOwnerId())) {
            throw new ForbiddenOperationException("you can only favorite your own pets");
        }
        if (!favorites.existsByIdOwnerIdAndIdPetId(ownerId, petId)) {
            PetFavorite fav = new PetFavorite();
            fav.setId(new PetFavoriteId(ownerId, petId));
            favorites.save(fav);
        }
    }

    @Transactional
    public void removeFavorite(Jwt jwt, UUID petId) {
        UUID ownerId = UUID.fromString(jwt.getSubject());
        favorites.deleteByIdOwnerIdAndIdPetId(ownerId, petId);
    }

    private PetListItemResponse toListItem(Pet pet, PetSearchRow row) {
        PetListItemResponse item = new PetListItemResponse();
        BeanUtils.copyProperties(PetMapper.toDto(pet), item);
        if (row != null) {
            item.setFavorite(row.isFavorite());
            item.setHasRecommendation(row.isHasRecommendation());
        }
        return item;
    }
}
