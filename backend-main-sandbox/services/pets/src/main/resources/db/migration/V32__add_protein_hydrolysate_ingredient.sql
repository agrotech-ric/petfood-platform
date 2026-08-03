INSERT INTO pets.ingredients (
    category, name, subtype, recommender_supported, owner_id, portion, calories,
    protein, fat, carbs, moisture, fiber, ash, cholesterol, sugar,
    calcium, phosphorus, magnesium, sodium, potassium, iron, copper, zinc, manganese,
    linoleic, alpha_linolenic, arachidonic, epa, dha, choline, selenium, iodine,
    vitamin_a, vitamin_e, vitamin_d, vitamin_b1, vitamin_b2, vitamin_b3, vitamin_b5,
    vitamin_b6, vitamin_b9, vitamin_b12, vitamin_c, vitamin_k, alpha_carotene,
    beta_carotene, beta_cryptoxanthin, lutein_zeaxanthin, lycopene, retinol,
    created_at, updated_at
)
SELECT
    'Дополнительные пищевые компоненты', 'Белковый гидролизат', 'Обыкновенный', TRUE, NULL, 100, 0,
    85.6, 4.51, 0, 3.71, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1
    FROM pets.ingredients
    WHERE owner_id IS NULL
      AND lower(name) = lower('Белковый гидролизат')
      AND lower(coalesce(subtype, '')) = lower('Обыкновенный')
);
