ALTER TABLE pets.ingredients
    ADD COLUMN owner_id UUID;

CREATE INDEX idx_ingredients_owner_id
    ON pets.ingredients (owner_id);
