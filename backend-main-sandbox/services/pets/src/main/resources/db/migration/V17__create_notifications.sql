CREATE TABLE IF NOT EXISTS pets.notifications (
                                                  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    UUID NOT NULL,
    pet_id      UUID NOT NULL,
    message     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

CREATE INDEX IF NOT EXISTS ix_notifications_owner_created
    ON pets.notifications (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_notifications_pet_created
    ON pets.notifications (pet_id, created_at DESC);
