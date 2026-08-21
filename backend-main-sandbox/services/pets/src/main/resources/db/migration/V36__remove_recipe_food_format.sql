DROP INDEX IF EXISTS pets.idx_recipes_format;

ALTER TABLE pets.recipes
    DROP CONSTRAINT IF EXISTS recipes_format_check,
    DROP COLUMN IF EXISTS food_format;
