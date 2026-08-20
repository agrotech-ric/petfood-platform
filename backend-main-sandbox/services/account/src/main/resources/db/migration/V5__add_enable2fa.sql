DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='enable_2fa') THEN
ALTER TABLE users
    ADD COLUMN enable_2fa BOOLEAN NOT NULL DEFAULT FALSE;
END IF;
END $$;
