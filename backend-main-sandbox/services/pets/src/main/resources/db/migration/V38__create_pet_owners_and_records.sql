CREATE TABLE pets.pet_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(200),
    country VARCHAR(100),
    city VARCHAR(100),
    address VARCHAR(300),
    phone VARCHAR(32),
    email VARCHAR(254),
    telegram VARCHAR(100),
    avatar_object_key VARCHAR(512),
    placeholder BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_pet_owner_email CHECK (email IS NULL OR email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
    CONSTRAINT chk_pet_owner_phone CHECK (phone IS NULL OR phone ~ '^\+?[1-9][0-9]{9,14}$'),
    CONSTRAINT chk_pet_owner_telegram CHECK (telegram IS NULL OR telegram ~ '^@[A-Za-z0-9_]{5,32}$'),
    CONSTRAINT chk_pet_owner_name CHECK (placeholder OR (full_name IS NOT NULL AND btrim(full_name) <> ''))
);

CREATE INDEX ix_pet_owners_name ON pets.pet_owners (lower(full_name));
CREATE INDEX ix_pet_owners_phone ON pets.pet_owners (phone);
CREATE INDEX ix_pet_owners_email ON pets.pet_owners (lower(email));

CREATE TABLE pets.pet_owner_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_owner_id UUID NOT NULL REFERENCES pets.pet_owners(id) ON DELETE CASCADE,
    topic VARCHAR(200) NOT NULL,
    record_date DATE NOT NULL,
    record_time TIME NOT NULL,
    message TEXT NOT NULL,
    use_email BOOLEAN NOT NULL DEFAULT FALSE,
    use_sms BOOLEAN NOT NULL DEFAULT FALSE,
    use_telegram BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(16) NOT NULL DEFAULT 'active',
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_pet_owner_record_topic CHECK (btrim(topic) <> ''),
    CONSTRAINT chk_pet_owner_record_message CHECK (btrim(message) <> ''),
    CONSTRAINT chk_pet_owner_record_channel CHECK (use_email OR use_sms OR use_telegram),
    CONSTRAINT chk_pet_owner_record_status CHECK (status IN ('active', 'archived'))
);

CREATE INDEX ix_pet_owner_records_owner_status_date
    ON pets.pet_owner_records (pet_owner_id, status, record_date, record_time);

ALTER TABLE pets.pets ADD COLUMN pet_owner_id UUID;

INSERT INTO pets.pet_owners (id, placeholder)
SELECT DISTINCT owner_id, TRUE
FROM pets.pets
WHERE owner_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

UPDATE pets.pets
SET pet_owner_id = owner_id
WHERE pet_owner_id IS NULL AND owner_id IS NOT NULL;

ALTER TABLE pets.pets
    ADD CONSTRAINT pets_pet_owner_id_fkey
    FOREIGN KEY (pet_owner_id) REFERENCES pets.pet_owners(id) ON DELETE RESTRICT;

CREATE INDEX ix_pets_pet_owner ON pets.pets (pet_owner_id);

CREATE TRIGGER trg_pet_owners_set_updated_at
    BEFORE UPDATE ON pets.pet_owners
    FOR EACH ROW EXECUTE FUNCTION pets_set_updated_at();

CREATE TRIGGER trg_pet_owner_records_set_updated_at
    BEFORE UPDATE ON pets.pet_owner_records
    FOR EACH ROW EXECUTE FUNCTION pets_set_updated_at();
