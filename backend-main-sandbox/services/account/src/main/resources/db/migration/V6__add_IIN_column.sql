ALTER TABLE users
    ADD COLUMN IF NOT EXISTS iin varchar(12);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND indexname='uk_users_iin'
  ) THEN
CREATE UNIQUE INDEX uk_users_iin ON users(iin);
END IF;
END $$;
