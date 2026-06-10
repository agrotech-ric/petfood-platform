CREATE TABLE IF NOT EXISTS pet_health_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    health_record_id UUID NOT NULL,
    vet_id UUID NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE pet_health_recommendations
    ADD CONSTRAINT fk_pet_health_recommendations_health_record
        FOREIGN KEY (health_record_id)
            REFERENCES pets.pet_health_records (id)
            ON DELETE CASCADE;

ALTER TABLE pet_health_recommendations
    ADD CONSTRAINT uk_pet_health_recommendations_health_record
        UNIQUE (health_record_id);
