-- Add supporter-only content fields to tracks table
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS is_supporter_only boolean DEFAULT false;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS required_tier text DEFAULT NULL;

-- Add supporter-only content fields to artist_video_posts table  
ALTER TABLE artist_video_posts ADD COLUMN IF NOT EXISTS is_supporter_only boolean DEFAULT false;
ALTER TABLE artist_video_posts ADD COLUMN IF NOT EXISTS required_tier text DEFAULT NULL;