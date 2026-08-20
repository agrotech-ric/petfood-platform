CREATE TABLE IF NOT EXISTS reproductive_statuses (
    id                BIGSERIAL PRIMARY KEY,
    code              VARCHAR(50)  NOT NULL UNIQUE,
    name              VARCHAR(128) NOT NULL,
    gender            VARCHAR(10)  NOT NULL,
    requires_substatus BOOLEAN     NOT NULL DEFAULT FALSE
    );

CREATE TABLE IF NOT EXISTS reproductive_substatuses (
    id        BIGSERIAL PRIMARY KEY,
    status_id BIGINT      NOT NULL REFERENCES reproductive_statuses(id) ON DELETE CASCADE,
    code      VARCHAR(50) NOT NULL,
    name      VARCHAR(128) NOT NULL,
    UNIQUE(status_id, code)
    );

ALTER TABLE pets
    ADD COLUMN IF NOT EXISTS reproductive_status_id     BIGINT,
    ADD COLUMN IF NOT EXISTS reproductive_substatus_id  BIGINT,
    ADD COLUMN IF NOT EXISTS puppies_count              INTEGER,
    ADD CONSTRAINT fk_pets_reproductive_status
    FOREIGN KEY (reproductive_status_id) REFERENCES reproductive_statuses(id),
    ADD CONSTRAINT fk_pets_reproductive_substatus
    FOREIGN KEY (reproductive_substatus_id) REFERENCES reproductive_substatuses(id);

INSERT INTO reproductive_statuses (code, name, gender, requires_substatus) VALUES
    ('female_none',      'Нет',                      'female', FALSE),
    ('female_pregnant',  'Щенность (беременность)',  'female', TRUE),
    ('female_lactation', 'Период лактации',          'female', TRUE),
    ('male_neutered',    'Кастрирован',              'male',   FALSE),
    ('male_intact',      'Не кастрирован',           'male',   FALSE)
    ON CONFLICT (code) DO NOTHING;

INSERT INTO reproductive_substatuses (status_id, code, name)
SELECT s.id, v.code, v.name
FROM (
         VALUES
             ('female_pregnant',  'early_4_weeks', 'Первые 4 недели беременности'),
             ('female_pregnant',  'last_5_weeks',  'Последние 5 недель беременности'),
             ('female_lactation', 'week_1',        '1 неделя'),
             ('female_lactation', 'week_2',        '2 неделя'),
             ('female_lactation', 'week_3',        '3 неделя'),
             ('female_lactation', 'week_4',        '4 неделя')
     ) AS v(status_code, code, name)
         JOIN reproductive_statuses s ON s.code = v.status_code
    ON CONFLICT (status_id, code) DO NOTHING;

ALTER TABLE pets
    ADD COLUMN IF NOT EXISTS passport_id VARCHAR(64);
ALTER TABLE pets
    ADD COLUMN IF NOT EXISTS weight_kg DOUBLE PRECISION;
