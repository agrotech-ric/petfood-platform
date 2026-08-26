package dev.pet.pets.service;

import dev.pet.pets.domain.Pet;
import dev.pet.pets.domain.Recipe;
import dev.pet.pets.domain.ResourceShare;
import dev.pet.pets.domain.ShareResourceType;
import dev.pet.pets.dto.ShareLinkResponse;
import dev.pet.pets.error.BadRequestException;
import dev.pet.pets.error.NotFoundException;
import dev.pet.pets.repo.PetRepository;
import dev.pet.pets.repo.RecipeRepository;
import dev.pet.pets.repo.ResourceShareRepository;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResourceShareService {
    private static final String PUBLIC_NOT_FOUND = "Shared resource not found";

    private final ResourceShareRepository shareRepository;
    private final PetRepository petRepository;
    private final RecipeRepository recipeRepository;
    private final ShareTokenService tokenService;

    public ResourceShareService(
        ResourceShareRepository shareRepository,
        PetRepository petRepository,
        RecipeRepository recipeRepository,
        ShareTokenService tokenService
    ) {
        this.shareRepository = shareRepository;
        this.petRepository = petRepository;
        this.recipeRepository = recipeRepository;
        this.tokenService = tokenService;
    }

    @Transactional(readOnly = true)
    public ShareLinkResponse getPetShare(Jwt jwt, UUID petId) {
        Pet pet = ownedPet(petId, subject(jwt));
        return shareRepository.findByPet_IdAndRevokedAtIsNull(pet.getId())
            .map(share -> response(share, true))
            .orElseGet(ShareLinkResponse::inactive);
    }

    @Transactional
    public ShareLinkResponse createPetShare(Jwt jwt, UUID petId) {
        Pet pet = ownedPetForUpdate(petId, subject(jwt));
        ResourceShare share = shareRepository.findActivePetForUpdate(petId)
            .orElseGet(() -> shareRepository.save(ResourceShare.forPet(pet, OffsetDateTime.now())));
        return response(share, true);
    }

    @Transactional
    public ShareLinkResponse rotatePetShare(Jwt jwt, UUID petId) {
        Pet pet = ownedPetForUpdate(petId, subject(jwt));
        revoke(shareRepository.findActivePetForUpdate(petId));
        return response(shareRepository.save(ResourceShare.forPet(pet, OffsetDateTime.now())), true);
    }

    @Transactional
    public void revokePetShare(Jwt jwt, UUID petId) {
        ownedPetForUpdate(petId, subject(jwt));
        revoke(shareRepository.findActivePetForUpdate(petId));
    }

    @Transactional(readOnly = true)
    public ShareLinkResponse getRecipeShare(Jwt jwt, long recipeId) {
        Recipe recipe = ownedRecipe(recipeId, subject(jwt));
        return shareRepository.findByRecipe_IdAndRevokedAtIsNull(recipeId)
            .map(share -> response(share, isCalculated(recipe)))
            .orElseGet(ShareLinkResponse::inactive);
    }

    @Transactional
    public ShareLinkResponse createRecipeShare(Jwt jwt, long recipeId) {
        Recipe recipe = ownedRecipeForUpdate(recipeId, subject(jwt));
        requireCalculated(recipe);
        ResourceShare share = shareRepository.findActiveRecipeForUpdate(recipeId)
            .orElseGet(() -> shareRepository.save(ResourceShare.forRecipe(recipe, OffsetDateTime.now())));
        return response(share, true);
    }

    @Transactional
    public ShareLinkResponse rotateRecipeShare(Jwt jwt, long recipeId) {
        Recipe recipe = ownedRecipeForUpdate(recipeId, subject(jwt));
        requireCalculated(recipe);
        revoke(shareRepository.findActiveRecipeForUpdate(recipeId));
        return response(shareRepository.save(ResourceShare.forRecipe(recipe, OffsetDateTime.now())), true);
    }

    @Transactional
    public void revokeRecipeShare(Jwt jwt, long recipeId) {
        ownedRecipeForUpdate(recipeId, subject(jwt));
        revoke(shareRepository.findActiveRecipeForUpdate(recipeId));
    }

    @Transactional(readOnly = true)
    public ResourceShare resolvePublic(String token, ShareResourceType expectedType) {
        UUID id = tokenService.verify(token).orElseThrow(this::publicNotFound);
        ResourceShare share = shareRepository.findByIdAndRevokedAtIsNull(id)
            .filter(item -> item.getResourceType() == expectedType)
            .orElseThrow(this::publicNotFound);
        if (expectedType == ShareResourceType.PET && share.getPet() == null) {
            throw publicNotFound();
        }
        if (expectedType == ShareResourceType.RECIPE
            && (share.getRecipe() == null || !isCalculated(share.getRecipe()))) {
            throw publicNotFound();
        }
        return share;
    }

    public boolean isCalculated(Recipe recipe) {
        return "calculated".equals(recipe.getStatus())
            && recipe.getCalculationResult() != null
            && !recipe.getCalculationResult().isNull()
            && recipe.getCalculatedAt() != null;
    }

    private void requireCalculated(Recipe recipe) {
        if (!isCalculated(recipe)) {
            throw new BadRequestException("Only a fully calculated recipe can be shared");
        }
    }

    private Pet ownedPet(UUID petId, UUID ownerId) {
        Pet pet = petRepository.findById(petId).orElseThrow(this::privateNotFound);
        if (!ownerId.equals(pet.getOwnerId())) throw privateNotFound();
        return pet;
    }

    private Pet ownedPetForUpdate(UUID petId, UUID ownerId) {
        Pet pet = petRepository.findByIdForUpdate(petId).orElseThrow(this::privateNotFound);
        if (!ownerId.equals(pet.getOwnerId())) throw privateNotFound();
        return pet;
    }

    private Recipe ownedRecipe(long recipeId, UUID ownerId) {
        Recipe recipe = recipeRepository.findById(recipeId).orElseThrow(this::privateNotFound);
        if (!ownerId.equals(recipe.getOwnerId())) throw privateNotFound();
        return recipe;
    }

    private Recipe ownedRecipeForUpdate(long recipeId, UUID ownerId) {
        Recipe recipe = recipeRepository.findByIdForUpdate(recipeId).orElseThrow(this::privateNotFound);
        if (!ownerId.equals(recipe.getOwnerId())) throw privateNotFound();
        return recipe;
    }

    private void revoke(Optional<ResourceShare> current) {
        current.ifPresent(share -> {
            share.setRevokedAt(OffsetDateTime.now());
            shareRepository.saveAndFlush(share);
        });
    }

    private ShareLinkResponse response(ResourceShare share, boolean available) {
        return new ShareLinkResponse(
            true,
            available,
            tokenService.publicUrl(share.getResourceType(), share.getId()),
            share.getCreatedAt()
        );
    }

    private UUID subject(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    private NotFoundException privateNotFound() {
        return new NotFoundException("Resource not found");
    }

    private NotFoundException publicNotFound() {
        return new NotFoundException(PUBLIC_NOT_FOUND);
    }
}
