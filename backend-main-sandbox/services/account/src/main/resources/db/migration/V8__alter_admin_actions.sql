DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_actions' AND column_name = 'ip'
    ) THEN
ALTER TABLE admin_actions ADD COLUMN ip VARCHAR(64);
END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_admin_actions_created ON admin_actions (created_at DESC);
CREATE INDEX IF NOT EXISTS ix_admin_actions_admin ON admin_actions (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_admin_actions_target ON admin_actions (target_user_id, created_at DESC);
