CREATE TABLE IF NOT EXISTS pet_foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    food_type VARCHAR(64) NOT NULL,
    food_format VARCHAR(64) NOT NULL,
    calories INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_pet_foods_pet_id ON pet_foods(pet_id);
CREATE INDEX IF NOT EXISTS ix_pet_foods_owner_id ON pet_foods(owner_id);
