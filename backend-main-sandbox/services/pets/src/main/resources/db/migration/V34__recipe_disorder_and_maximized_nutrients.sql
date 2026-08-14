ALTER TABLE pets.recipes
    ADD COLUMN target_disorder VARCHAR(255),
    ADD COLUMN maximize_nutrients JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE pets.recipes recipe
SET target_disorder = condition.name_ru
FROM pets.health_conditions condition
WHERE recipe.target_health_condition_id = condition.id;

UPDATE pets.recipes
SET maximize_nutrients = jsonb_build_array(maximize_nutrient)
WHERE maximize_nutrient IS NOT NULL AND BTRIM(maximize_nutrient) <> '';

ALTER TABLE pets.recipes
    DROP COLUMN maximize_nutrient;
