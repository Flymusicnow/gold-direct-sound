
-- ============================================
-- WAVE 1 COMMUNITY ECOSYSTEM MIGRATION
-- Implements SUPER CARD spec adapted for FlyMusic
-- ============================================

-- Phase 1: Create Helper Functions
-- ============================================

-- tier_rank function (SUPER CARD spec)
CREATE OR REPLACE FUNCTION public.tier_rank(tier text)
RETURNS int
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE lower(coalesce(tier,'free'))
    WHEN 'free' THEN 0
    WHEN 'bronze' THEN 1
    WHEN 'silver' THEN 2
    WHEN 'gold' THEN 3
    WHEN 'diamond' THEN 4
    ELSE -1
  END;
$$;

-- set_updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- Phase 3: Update communities Table
-- ============================================

ALTER TABLE communities
ADD COLUMN IF NOT EXISTS banner_media_url text,
ADD COLUMN IF NOT EXISTS banner_media_type text,
ADD COLUMN IF NOT EXISTS spotlight_carousel jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS community_rules text,
ADD COLUMN IF NOT EXISTS moderators jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Add check constraint for banner_media_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'communities_banner_media_type_check'
  ) THEN
    ALTER TABLE communities ADD CONSTRAINT communities_banner_media_type_check 
    CHECK (banner_media_type IS NULL OR banner_media_type IN ('image','video'));
  END IF;
END $$;

-- Add updated_at trigger for communities
DROP TRIGGER IF EXISTS trg_communities_updated_at ON communities;
CREATE TRIGGER trg_communities_updated_at
BEFORE UPDATE ON communities
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Update communities RLS policies per SUPER CARD
DROP POLICY IF EXISTS "Anyone can view communities" ON communities;
DROP POLICY IF EXISTS "Artists can manage own community" ON communities;
DROP POLICY IF EXISTS "communities_select_all" ON communities;
DROP POLICY IF EXISTS "communities_artist_manage" ON communities;

CREATE POLICY "communities_select_all"
ON communities FOR SELECT
USING (true);

CREATE POLICY "communities_artist_manage"
ON communities FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM artist_profiles ap
    WHERE ap.id = communities.artist_id AND ap.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM artist_profiles ap
    WHERE ap.id = communities.artist_id AND ap.user_id = auth.uid()
  )
);

-- Phase 4: Create community_posts Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_type text NOT NULL CHECK (author_type IN ('artist','fan')),
  content text NOT NULL,
  media_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  post_type text NOT NULL DEFAULT 'text'
    CHECK (post_type IN ('text','image','video','audio')),
  tier_required text NOT NULL DEFAULT 'free'
    CHECK (lower(tier_required) IN ('free','bronze','silver','gold','diamond')),
  is_pinned boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  reaction_count int NOT NULL DEFAULT 0,
  comment_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for community_posts
CREATE INDEX IF NOT EXISTS idx_community_posts_community_created 
ON community_posts(community_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_posts_author
ON community_posts(author_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_community_posts_updated_at ON community_posts;
CREATE TRIGGER trg_community_posts_updated_at
BEFORE UPDATE ON community_posts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_posts (adapted for artist_profiles + supporter_subscriptions)
DROP POLICY IF EXISTS "posts_select_gated" ON community_posts;
CREATE POLICY "posts_select_gated"
ON community_posts FOR SELECT
USING (
  lower(tier_required) = 'free'
  OR author_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM communities c
    JOIN artist_profiles ap ON ap.id = c.artist_id
    WHERE c.id = community_id AND ap.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM communities c
    JOIN artist_profiles ap ON ap.id = c.artist_id
    JOIN supporter_subscriptions s
      ON s.artist_id = ap.id
     AND s.fan_user_id = auth.uid()
     AND lower(s.status) = 'active'
    WHERE c.id = community_id
      AND public.tier_rank(s.tier) >= public.tier_rank(community_posts.tier_required)
  )
);

DROP POLICY IF EXISTS "posts_insert_own" ON community_posts;
CREATE POLICY "posts_insert_own"
ON community_posts FOR INSERT
WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "posts_update_author_or_artist_owner" ON community_posts;
CREATE POLICY "posts_update_author_or_artist_owner"
ON community_posts FOR UPDATE
USING (
  author_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM communities c
    JOIN artist_profiles ap ON ap.id = c.artist_id
    WHERE c.id = community_id AND ap.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "posts_delete_author_or_artist_owner" ON community_posts;
CREATE POLICY "posts_delete_author_or_artist_owner"
ON community_posts FOR DELETE
USING (
  author_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM communities c
    JOIN artist_profiles ap ON ap.id = c.artist_id
    WHERE c.id = community_id AND ap.user_id = auth.uid()
  )
);

-- Phase 5: Create post_comments Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES post_comments(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  reaction_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for post_comments
CREATE INDEX IF NOT EXISTS idx_post_comments_post_created 
ON post_comments(post_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_post_comments_parent 
ON post_comments(parent_comment_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_post_comments_updated_at ON post_comments;
CREATE TRIGGER trg_post_comments_updated_at
BEFORE UPDATE ON post_comments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable RLS
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- RLS with inherited post visibility
DROP POLICY IF EXISTS "comments_select_if_post_visible" ON post_comments;
CREATE POLICY "comments_select_if_post_visible"
ON post_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_posts p
    WHERE p.id = post_id
      AND (
        lower(p.tier_required) = 'free'
        OR p.author_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM communities c
          JOIN artist_profiles ap ON ap.id = c.artist_id
          WHERE c.id = p.community_id AND ap.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM communities c
          JOIN artist_profiles ap ON ap.id = c.artist_id
          JOIN supporter_subscriptions s
            ON s.artist_id = ap.id
           AND s.fan_user_id = auth.uid()
           AND lower(s.status) = 'active'
          WHERE c.id = p.community_id
            AND public.tier_rank(s.tier) >= public.tier_rank(p.tier_required)
        )
      )
  )
);

DROP POLICY IF EXISTS "comments_insert_own" ON post_comments;
CREATE POLICY "comments_insert_own"
ON post_comments FOR INSERT
WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "comments_update_author_or_artist_owner" ON post_comments;
CREATE POLICY "comments_update_author_or_artist_owner"
ON post_comments FOR UPDATE
USING (
  author_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM community_posts p
    JOIN communities c ON c.id = p.community_id
    JOIN artist_profiles ap ON ap.id = c.artist_id
    WHERE p.id = post_id AND ap.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "comments_delete_author_or_artist_owner" ON post_comments;
CREATE POLICY "comments_delete_author_or_artist_owner"
ON post_comments FOR DELETE
USING (
  author_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM community_posts p
    JOIN communities c ON c.id = p.community_id
    JOIN artist_profiles ap ON ap.id = c.artist_id
    WHERE p.id = post_id AND ap.user_id = auth.uid()
  )
);

-- Phase 6: Create post_reactions Table for community_posts
-- ============================================

-- First drop existing post_reactions if it references old tables
DROP TABLE IF EXISTS post_reactions CASCADE;

CREATE TABLE public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL DEFAULT 'heart' CHECK (reaction_type = 'heart'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, reaction_type)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);

-- Enable RLS
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

-- RLS with inherited post visibility
DROP POLICY IF EXISTS "reactions_select_if_post_visible" ON post_reactions;
CREATE POLICY "reactions_select_if_post_visible"
ON post_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_posts p
    WHERE p.id = post_id
      AND (
        lower(p.tier_required) = 'free'
        OR p.author_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM communities c
          JOIN artist_profiles ap ON ap.id = c.artist_id
          WHERE c.id = p.community_id AND ap.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM communities c
          JOIN artist_profiles ap ON ap.id = c.artist_id
          JOIN supporter_subscriptions s
            ON s.artist_id = ap.id
           AND s.fan_user_id = auth.uid()
           AND lower(s.status) = 'active'
          WHERE c.id = p.community_id
            AND public.tier_rank(s.tier) >= public.tier_rank(p.tier_required)
        )
      )
  )
);

DROP POLICY IF EXISTS "reactions_insert_own" ON post_reactions;
CREATE POLICY "reactions_insert_own"
ON post_reactions FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reactions_delete_own" ON post_reactions;
CREATE POLICY "reactions_delete_own"
ON post_reactions FOR DELETE
USING (user_id = auth.uid());

-- Reaction count trigger
CREATE OR REPLACE FUNCTION public.update_post_reaction_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF tg_op = 'INSERT' THEN
    UPDATE community_posts SET reaction_count = reaction_count + 1 WHERE id = new.post_id;
  ELSIF tg_op = 'DELETE' THEN
    UPDATE community_posts SET reaction_count = greatest(reaction_count - 1, 0) WHERE id = old.post_id;
  END IF;
  RETURN null;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_reaction_count ON post_reactions;
CREATE TRIGGER trg_post_reaction_count
AFTER INSERT OR DELETE ON post_reactions
FOR EACH ROW EXECUTE FUNCTION update_post_reaction_count();

-- Phase 7: Comment Count Trigger
-- ============================================

CREATE OR REPLACE FUNCTION public.update_post_comment_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF tg_op = 'INSERT' THEN
    UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = new.post_id;
  ELSIF tg_op = 'DELETE' THEN
    UPDATE community_posts SET comment_count = greatest(comment_count - 1, 0) WHERE id = old.post_id;
  END IF;
  RETURN null;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_comment_count ON post_comments;
CREATE TRIGGER trg_post_comment_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();
