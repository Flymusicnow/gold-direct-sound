-- Add is_pinned column to playlists for Quick Add feature
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

-- Index for fast lookup of pinned stack
CREATE INDEX IF NOT EXISTS idx_playlists_user_pinned ON playlists(user_id, is_pinned) WHERE is_pinned = true;

-- Add lyrics column to tracks for Now Playing screen
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS lyrics text;