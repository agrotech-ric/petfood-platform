ALTER TABLE pets.pet_health_recommendations
    ALTER COLUMN payload TYPE text USING payload::text;
