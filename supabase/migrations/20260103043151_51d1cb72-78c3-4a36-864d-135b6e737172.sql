-- ================================================
-- WAVE 1: Community Ecosystem Foundation
-- ================================================

-- 1. Update feature_flags table with artist-allowlist and config
ALTER TABLE feature_flags
ADD COLUMN IF NOT EXISTS enabled_for_artists uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS requires_legal_approval boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_payment_setup boolean DEFAULT false;

-- 2. Create communities table (1 per artist)
CREATE TABLE IF NOT EXISTS communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL UNIQUE REFERENCES artist_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on communities
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Communities are publicly readable (metadata only)
CREATE POLICY "Anyone can view communities"
ON communities FOR SELECT
USING (true);

-- Artists can manage their own community
CREATE POLICY "Artists can manage own community"
ON communities FOR ALL
USING (EXISTS (
  SELECT 1 FROM artist_profiles ap
  WHERE ap.id = communities.artist_id AND ap.user_id = auth.uid()
));

-- 3. Update artist_posts for tier-gating
ALTER TABLE artist_posts
ADD COLUMN IF NOT EXISTS tier_required text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS media_urls jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS community_id uuid REFERENCES communities(id);

-- Add check constraint for tier values
ALTER TABLE artist_posts
DROP CONSTRAINT IF EXISTS artist_posts_tier_required_check;

ALTER TABLE artist_posts
ADD CONSTRAINT artist_posts_tier_required_check 
CHECK (tier_required IN ('free', 'bronze', 'silver', 'gold', 'diamond'));

-- 4. Create post_reactions table (heart only)
CREATE TABLE IF NOT EXISTS post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES artist_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text DEFAULT 'heart' CHECK (reaction_type = 'heart'),
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS on post_reactions
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can view reactions
CREATE POLICY "Anyone can view reactions"
ON post_reactions FOR SELECT
USING (true);

-- Users can add their own reactions
CREATE POLICY "Users can add own reactions"
ON post_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can remove own reactions"
ON post_reactions FOR DELETE
USING (auth.uid() = user_id);

-- 5. Add banner_url to artist_profiles
ALTER TABLE artist_profiles
ADD COLUMN IF NOT EXISTS banner_url text;

-- 6. Create tier_level function for subscription comparison
CREATE OR REPLACE FUNCTION tier_level(tier text)
RETURNS integer AS $$
BEGIN
  RETURN CASE tier
    WHEN 'diamond' THEN 5
    WHEN 'gold' THEN 4
    WHEN 'silver' THEN 3
    WHEN 'bronze' THEN 2
    WHEN 'free' THEN 1
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Create function to check if user can view a post based on subscription
CREATE OR REPLACE FUNCTION user_can_view_post(
  p_tier_required text,
  p_artist_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p_tier_required = 'free' 
    OR EXISTS (
      SELECT 1 FROM artist_profiles ap 
      WHERE ap.id = p_artist_id AND ap.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM supporter_subscriptions ss
      WHERE ss.fan_user_id = auth.uid()
        AND ss.artist_id = p_artist_id
        AND ss.status = 'active'
        AND tier_level(ss.tier) >= tier_level(p_tier_required)
    );
$$;

-- 8. Update artist_posts RLS for subscription gating
DROP POLICY IF EXISTS "Anyone can view public posts" ON artist_posts;

CREATE POLICY "Users can view posts based on subscription"
ON artist_posts FOR SELECT
USING (
  user_can_view_post(tier_required, artist_id)
  OR is_admin()
);

-- 9. Insert Wave 1 feature flags
INSERT INTO feature_flags (flag_key, flag_name, is_enabled, description, enabled_for_artists, config)
VALUES 
  ('COMMUNITY_FEED', 'Community Feed', true, 'Artist community posts and comments', '{}', '{}'),
  ('SUBSCRIPTION_TIERS', 'Subscription Tiers', true, 'Fan subscription tiers for artists', '{}', '{}'),
  ('SPOTLIGHT_CAROUSEL', 'Spotlight Carousel', true, 'Artist profile spotlight media carousel', '{}', '{}')
ON CONFLICT (flag_key) DO UPDATE SET
  flag_name = EXCLUDED.flag_name,
  description = EXCLUDED.description;

-- 10. Create trigger to auto-create community when artist profile is created
CREATE OR REPLACE FUNCTION create_artist_community()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO communities (artist_id, name, description)
  VALUES (NEW.id, NEW.artist_name || '''s Community', 'Welcome to ' || NEW.artist_name || '''s community!')
  ON CONFLICT (artist_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_artist_profile_created ON artist_profiles;
CREATE TRIGGER on_artist_profile_created
  AFTER INSERT ON artist_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_artist_community();

-- 11. Create communities for existing artists
INSERT INTO communities (artist_id, name, description)
SELECT id, artist_name || '''s Community', 'Welcome to ' || artist_name || '''s community!'
FROM artist_profiles
WHERE NOT EXISTS (SELECT 1 FROM communities c WHERE c.artist_id = artist_profiles.id)
ON CONFLICT (artist_id) DO NOTHING;