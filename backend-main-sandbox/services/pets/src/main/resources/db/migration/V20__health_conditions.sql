CREATE TABLE IF NOT EXISTS pets.health_conditions (
    id       BIGSERIAL PRIMARY KEY,
    code     VARCHAR(64)  NOT NULL UNIQUE,
    name_ru  VARCHAR(128) NOT NULL
);

INSERT INTO pets.health_conditions (code, name_ru) VALUES
    ('healthy',      'Здоровый'),
    ('obesity',      'Ожирение'),
    ('allergy',      'Аллергия'),
    ('urolithiasis', 'Мочекаменная болезнь'),
    ('diabetes',     'Сахарный диабет')
ON CONFLICT (code) DO NOTHING;
