DROP INDEX IF EXISTS pets.idx_recipes_type;

ALTER TABLE pets.recipes
    DROP CONSTRAINT IF EXISTS recipes_type_check,
    DROP COLUMN IF EXISTS recipe_type;
