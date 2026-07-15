ALTER TABLE pets.pets
    ADD COLUMN IF NOT EXISTS comments TEXT;

ALTER TABLE pets.pet_health_records
    ADD COLUMN IF NOT EXISTS condition_name VARCHAR(255);
