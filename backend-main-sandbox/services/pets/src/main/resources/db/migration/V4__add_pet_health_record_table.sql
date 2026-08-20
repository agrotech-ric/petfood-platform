CREATE TABLE IF NOT EXISTS pet_health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL,
    activity_type_id BIGINT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    owner_id UUID NOT NULL
    );

ALTER TABLE pet_health_records
    ADD CONSTRAINT fk_pet_health_records_pet_id FOREIGN KEY (pet_id)
        REFERENCES pets(id) ON DELETE CASCADE;

ALTER TABLE pet_health_records
    ADD CONSTRAINT fk_pet_health_records_activity_type_id FOREIGN KEY (activity_type_id)
        REFERENCES activity_types(id) ON DELETE CASCADE;
