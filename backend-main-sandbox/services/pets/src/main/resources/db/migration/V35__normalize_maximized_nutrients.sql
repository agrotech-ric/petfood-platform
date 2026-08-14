UPDATE pets.recipes recipe
SET maximize_nutrients = COALESCE((
    SELECT jsonb_agg(value ORDER BY ordinal)
    FROM jsonb_array_elements_text(recipe.maximize_nutrients) WITH ORDINALITY AS item(value, ordinal)
    WHERE value IN ('moisture', 'protein', 'carbs', 'fat')
), '[]'::jsonb);
