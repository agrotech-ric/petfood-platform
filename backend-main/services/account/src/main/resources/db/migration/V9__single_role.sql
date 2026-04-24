DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
ALTER TABLE users
    ADD COLUMN role VARCHAR(32);
END IF;
END $$;

DO $$
BEGIN
   IF EXISTS (SELECT 1 FROM users WHERE role IS NULL) THEN
UPDATE users SET role = 'USER' WHERE role IS NULL;
END IF;
END $$;

DO $$
BEGIN
   IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role' AND is_nullable = 'YES') THEN
ALTER TABLE users ALTER COLUMN role SET NOT NULL;
END IF;
END $$;
