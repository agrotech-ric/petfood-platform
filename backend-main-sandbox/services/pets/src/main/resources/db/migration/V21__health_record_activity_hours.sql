ALTER TABLE pet_health_records
    ADD COLUMN IF NOT EXISTS activity_hours DOUBLE PRECISION;

ALTER TABLE pet_health_records
    ADD COLUMN IF NOT EXISTS record_date DATE;

UPDATE pet_health_records
SET record_date = created_at::date
WHERE record_date IS NULL;
