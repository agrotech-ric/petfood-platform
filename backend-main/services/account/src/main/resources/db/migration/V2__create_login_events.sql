CREATE TABLE IF NOT EXISTS login_events (
    id          UUID PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL,
    user_id     UUID NOT NULL,
    ip          VARCHAR(64),
    user_agent  VARCHAR(255),
    success     BOOLEAN NOT NULL
    );


CREATE INDEX IF NOT EXISTS ix_login_events_user
    ON login_events (user_id, created_at);
