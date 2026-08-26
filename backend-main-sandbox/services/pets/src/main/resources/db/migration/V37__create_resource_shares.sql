CREATE TABLE pets.resource_shares (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL,
    resource_type VARCHAR(16) NOT NULL,
    pet_id UUID REFERENCES pets.pets(id) ON DELETE CASCADE,
    recipe_id BIGINT REFERENCES pets.recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ,
    CONSTRAINT resource_shares_type_check CHECK (resource_type IN ('PET', 'RECIPE')),
    CONSTRAINT resource_shares_reference_check CHECK (
        (resource_type = 'PET' AND pet_id IS NOT NULL AND recipe_id IS NULL)
        OR
        (resource_type = 'RECIPE' AND pet_id IS NULL AND recipe_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX uq_resource_shares_active_pet
    ON pets.resource_shares (pet_id)
    WHERE revoked_at IS NULL AND resource_type = 'PET';

CREATE UNIQUE INDEX uq_resource_shares_active_recipe
    ON pets.resource_shares (recipe_id)
    WHERE revoked_at IS NULL AND resource_type = 'RECIPE';

CREATE INDEX idx_resource_shares_owner ON pets.resource_shares (owner_id);
CREATE INDEX idx_resource_shares_active_lookup ON pets.resource_shares (id) WHERE revoked_at IS NULL;
