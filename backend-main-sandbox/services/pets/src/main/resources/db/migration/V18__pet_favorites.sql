CREATE TABLE IF NOT EXISTS pets.pet_favorites (
    owner_id UUID NOT NULL,
    pet_id   UUID NOT NULL REFERENCES pets.pets(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (owner_id, pet_id)
);

CREATE INDEX IF NOT EXISTS ix_pet_favorites_owner ON pets.pet_favorites(owner_id);
