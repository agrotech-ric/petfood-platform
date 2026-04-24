ALTER TABLE users
    ADD COLUMN IF NOT EXISTS deleted_at timestamptz;


DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_users_email') THEN
ALTER TABLE users DROP CONSTRAINT uk_users_email;
END IF;
END$$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email_active
    ON users (lower(email))
    WHERE deleted_at IS NULL;
