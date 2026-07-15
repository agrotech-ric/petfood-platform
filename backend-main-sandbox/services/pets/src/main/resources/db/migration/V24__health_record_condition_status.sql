ALTER TABLE pets.pet_health_records
    ADD COLUMN IF NOT EXISTS condition_status VARCHAR(32) NOT NULL DEFAULT 'current';
