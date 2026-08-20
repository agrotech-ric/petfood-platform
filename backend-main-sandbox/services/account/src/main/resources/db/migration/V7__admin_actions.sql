DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='admin_actions') THEN
CREATE TABLE admin_actions (
                               id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                               created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                               admin_id UUID NOT NULL,
                               action TEXT NOT NULL,
                               target_user_id UUID,
                               details TEXT,
                               ip VARCHAR(64)
);
END IF;
END $$;

DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='admin_actions' AND indexname='ix_admin_actions_created') THEN
CREATE INDEX ix_admin_actions_created ON admin_actions (created_at DESC);
END IF;

   IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='admin_actions' AND indexname='ix_admin_actions_admin') THEN
CREATE INDEX ix_admin_actions_admin ON admin_actions (admin_id, created_at DESC);
END IF;

   IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='admin_actions' AND indexname='ix_admin_actions_target') THEN
CREATE INDEX ix_admin_actions_target ON admin_actions (target_user_id, created_at DESC);
END IF;
END $$;
