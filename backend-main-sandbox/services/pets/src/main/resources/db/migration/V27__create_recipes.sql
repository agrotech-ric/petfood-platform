CREATE TABLE pets.recipes (
    id BIGSERIAL PRIMARY KEY,
    owner_id UUID NOT NULL,
    pet_id UUID REFERENCES pets.pets(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    recipe_type VARCHAR(32) NOT NULL,
    food_format VARCHAR(32) NOT NULL,
    age_category VARCHAR(32) NOT NULL,
    breed_size VARCHAR(32) NOT NULL,
    target_weight_kg DOUBLE PRECISION CHECK (target_weight_kg > 0),
    target_breed_id BIGINT REFERENCES pets.breeds(id) ON DELETE SET NULL,
    target_age_months INTEGER CHECK (target_age_months >= 0),
    target_gender VARCHAR(16),
    target_activity_type_id BIGINT REFERENCES pets.activity_types(id) ON DELETE SET NULL,
    target_reproductive_status_id BIGINT REFERENCES pets.reproductive_statuses(id) ON DELETE SET NULL,
    target_health_condition_id BIGINT REFERENCES pets.health_conditions(id) ON DELETE SET NULL,
    target_energy_kcal DOUBLE PRECISION CHECK (target_energy_kcal > 0),
    maximize_nutrient VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'draft',
    calculation_result JSONB,
    calculation_version VARCHAR(64),
    calculated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT recipes_type_check CHECK (recipe_type IN ('domestic', 'commercial')),
    CONSTRAINT recipes_format_check CHECK (food_format IN ('wet', 'dry')),
    CONSTRAINT recipes_age_check CHECK (age_category IN ('puppies', 'adults', 'senior')),
    CONSTRAINT recipes_breed_size_check CHECK (breed_size IN ('all', 'small', 'medium', 'large')),
    CONSTRAINT recipes_gender_check CHECK (target_gender IS NULL OR target_gender IN ('male', 'female')),
    CONSTRAINT recipes_status_check CHECK (status IN ('draft', 'calculated'))
);

CREATE TABLE pets.recipe_ingredients (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES pets.recipes(id) ON DELETE CASCADE,
    ingredient_id BIGINT NOT NULL REFERENCES pets.ingredients(id) ON DELETE RESTRICT,
    min_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
    max_percent DOUBLE PRECISION NOT NULL DEFAULT 100,
    result_percent DOUBLE PRECISION,
    result_grams DOUBLE PRECISION,
    CONSTRAINT recipe_ingredients_unique UNIQUE (recipe_id, ingredient_id),
    CONSTRAINT recipe_ingredients_range_check CHECK (
        min_percent >= 0 AND max_percent <= 100 AND min_percent <= max_percent
    ),
    CONSTRAINT recipe_ingredients_result_percent_check CHECK (
        result_percent IS NULL OR (result_percent >= 0 AND result_percent <= 100)
    ),
    CONSTRAINT recipe_ingredients_result_grams_check CHECK (
        result_grams IS NULL OR result_grams >= 0
    )
);

CREATE TABLE pets.recipe_nutrient_constraints (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES pets.recipes(id) ON DELETE CASCADE,
    nutrient_key VARCHAR(64) NOT NULL,
    min_value DOUBLE PRECISION NOT NULL,
    max_value DOUBLE PRECISION NOT NULL,
    CONSTRAINT recipe_nutrient_constraints_unique UNIQUE (recipe_id, nutrient_key),
    CONSTRAINT recipe_nutrient_constraints_range_check CHECK (
        min_value >= 0 AND min_value <= max_value
    )
);

CREATE TABLE pets.recipe_symptoms (
    recipe_id BIGINT NOT NULL REFERENCES pets.recipes(id) ON DELETE CASCADE,
    symptom_id BIGINT NOT NULL REFERENCES pets.symptoms(id) ON DELETE RESTRICT,
    PRIMARY KEY (recipe_id, symptom_id)
);

CREATE INDEX idx_recipes_owner_updated ON pets.recipes (owner_id, updated_at DESC);
CREATE INDEX idx_recipes_pet ON pets.recipes (pet_id);
CREATE INDEX idx_recipes_type ON pets.recipes (recipe_type);
CREATE INDEX idx_recipes_format ON pets.recipes (food_format);
CREATE INDEX idx_recipes_age_category ON pets.recipes (age_category);
CREATE INDEX idx_recipes_breed_size ON pets.recipes (breed_size);
CREATE INDEX idx_recipe_ingredients_ingredient ON pets.recipe_ingredients (ingredient_id);
CREATE INDEX idx_recipe_symptoms_symptom ON pets.recipe_symptoms (symptom_id);
