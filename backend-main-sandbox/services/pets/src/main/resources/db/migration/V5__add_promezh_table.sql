CREATE TABLE IF NOT EXISTS pet_health_record_symptoms (
    pet_health_record_id UUID NOT NULL,
    symptom_id BIGINT NOT NULL,
    PRIMARY KEY (pet_health_record_id, symptom_id),
    CONSTRAINT fk_pet_health_record FOREIGN KEY (pet_health_record_id)
    REFERENCES pets.pet_health_records(id) ON DELETE CASCADE,
    CONSTRAINT fk_symptom FOREIGN KEY (symptom_id)
    REFERENCES pets.symptoms(id) ON DELETE CASCADE
    );
