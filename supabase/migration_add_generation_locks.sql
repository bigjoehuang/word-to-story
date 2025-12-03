-- Table for per-user story generation locks to prevent concurrent generations
CREATE TABLE IF NOT EXISTS generation_locks (
  user_id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_locks_created_at 
  ON generation_locks(created_at);

COMMENT ON TABLE generation_locks IS 'Per-user story generation locks to prevent concurrent generations';
COMMENT ON COLUMN generation_locks.user_id IS 'Device ID or user identifier for story generation lock';
