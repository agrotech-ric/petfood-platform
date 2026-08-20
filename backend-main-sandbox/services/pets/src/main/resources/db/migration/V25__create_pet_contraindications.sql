CREATE TABLE IF NOT EXISTS pets.pet_contraindications (
    pet_id UUID PRIMARY KEY REFERENCES pets.pets(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    ingredients_json TEXT NOT NULL DEFAULT '[]',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_pet_contraindications_owner_id
    ON pets.pet_contraindications(owner_id);
