ALTER TABLE pet_health_records
    ADD COLUMN IF NOT EXISTS weight_kg DOUBLE PRECISION;

UPDATE pet_health_records r
SET weight_kg = p.weight_kg
FROM pets p
WHERE r.pet_id = p.id
  AND r.weight_kg IS NULL;

ALTER TABLE pet_health_records
    ALTER COLUMN weight_kg SET NOT NULL;
