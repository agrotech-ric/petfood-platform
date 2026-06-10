CREATE SCHEMA IF NOT EXISTS pets;

CREATE TABLE IF NOT EXISTS species (
                                       id   BIGSERIAL PRIMARY KEY,
                                       code VARCHAR(64)  NOT NULL UNIQUE,
                                       name VARCHAR(128) NOT NULL
);

CREATE TABLE IF NOT EXISTS breeds (
                                      id         BIGSERIAL PRIMARY KEY,
                                      species_id BIGINT       NOT NULL REFERENCES species(id) ON DELETE RESTRICT,
                                      name       VARCHAR(128) NOT NULL,
                                      CONSTRAINT uq_breeds_species_name UNIQUE (species_id, name)
);

CREATE TABLE IF NOT EXISTS colors (
                                      id   BIGSERIAL PRIMARY KEY,
                                      name VARCHAR(64) NOT NULL UNIQUE
);

DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender') THEN
            CREATE TYPE gender AS ENUM ('male', 'female');
        END IF;
    END$$;

CREATE TABLE IF NOT EXISTS pets (
                                    id         UUID PRIMARY KEY,
                                    owner_id   UUID NOT NULL,
                                    species_id BIGINT NOT NULL REFERENCES species(id) ON DELETE RESTRICT,
                                    breed_id   BIGINT NOT NULL REFERENCES breeds(id)   ON DELETE RESTRICT,
                                    name       VARCHAR(100) NOT NULL,
                                    gender     gender NOT NULL,
                                    color_id   BIGINT NOT NULL REFERENCES colors(id)   ON DELETE RESTRICT,
                                    birth_date DATE   NOT NULL,

                                    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

                                    CONSTRAINT chk_pet_name_format
                                        CHECK (name ~ '^[[:alpha:][:space:]]+$'),
                                    CONSTRAINT chk_birth_not_future
                                        CHECK (birth_date <= current_date)
);

CREATE INDEX IF NOT EXISTS ix_pets_owner   ON pets(owner_id);
CREATE INDEX IF NOT EXISTS ix_pets_species ON pets(species_id);
CREATE INDEX IF NOT EXISTS ix_pets_breed   ON pets(breed_id);
CREATE INDEX IF NOT EXISTS ix_pets_gender  ON pets(gender);
CREATE INDEX IF NOT EXISTS ix_pets_color   ON pets(color_id);
CREATE INDEX IF NOT EXISTS ix_pets_birth   ON pets(birth_date);

CREATE OR REPLACE FUNCTION pets_set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pets_set_updated_at ON pets;
CREATE TRIGGER trg_pets_set_updated_at
    BEFORE UPDATE ON pets
    FOR EACH ROW
EXECUTE FUNCTION pets_set_updated_at();
