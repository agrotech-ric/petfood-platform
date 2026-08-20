CREATE TABLE IF NOT EXISTS activity_types (
                                                   id   BIGSERIAL PRIMARY KEY,
                                                   name VARCHAR(128) NOT NULL,
    description TEXT
    );

CREATE TABLE IF NOT EXISTS symptoms (
                                             id   BIGSERIAL PRIMARY KEY,
                                             name VARCHAR(128) NOT NULL,
    description TEXT
    );

CREATE INDEX IF NOT EXISTS ix_activity_types_name ON activity_types(name);
CREATE INDEX IF NOT EXISTS ix_symptoms_name ON symptoms(name);

