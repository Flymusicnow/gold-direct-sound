-- =====================================================
-- Artist Community Control & Identity - Database Update
-- =====================================================

-- 1. Add author_type and moderation fields to post_comments
ALTER TABLE public.post_comments 
ADD COLUMN IF NOT EXISTS author_type TEXT DEFAULT 'fan' CHECK (author_type IN ('artist', 'fan', 'moderator'));

ALTER TABLE public.post_comments
ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE public.post_comments
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

ALTER TABLE public.post_comments
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

ALTER TABLE public.post_comments
ADD COLUMN IF NOT EXISTS hidden_by UUID REFERENCES auth.users(id);

ALTER TABLE public.post_comments
ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ;

-- 2. Add banner source and about section to communities
ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS banner_source TEXT DEFAULT 'custom' CHECK (banner_source IN ('custom', 'profile', 'none'));

ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS about_content TEXT;

ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS about_mission TEXT;

ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS about_links JSONB DEFAULT '[]';

-- 3. Create community_moderators table
CREATE TABLE IF NOT EXISTS public.community_moderators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  can_hide_comments BOOLEAN DEFAULT true,
  can_pin_comments BOOLEAN DEFAULT true,
  can_hide_posts BOOLEAN DEFAULT false,
  can_pin_posts BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  UNIQUE(community_id, user_id)
);

-- Indexes for community_moderators
CREATE INDEX IF NOT EXISTS idx_community_mods_community ON public.community_moderators(community_id);
CREATE INDEX IF NOT EXISTS idx_community_mods_user ON public.community_moderators(user_id);
CREATE INDEX IF NOT EXISTS idx_community_mods_active ON public.community_moderators(community_id, is_active);

-- 4. Create community_member_events table for analytics
CREATE TABLE IF NOT EXISTS public.community_member_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('join', 'leave', 'upgrade', 'downgrade')),
  tier TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_events_community ON public.community_member_events(community_id);
CREATE INDEX IF NOT EXISTS idx_member_events_date ON public.community_member_events(created_at);

-- 5. Enable RLS on new tables
ALTER TABLE public.community_moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_member_events ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for community_moderators

-- Artists can manage moderators for their communities
CREATE POLICY "Artists can manage their community moderators"
ON public.community_moderators FOR ALL
USING (
  community_id IN (
    SELECT c.id FROM public.communities c
    JOIN public.artist_profiles ap ON c.artist_id = ap.id
    WHERE ap.user_id = auth.uid()
  )
)
WITH CHECK (
  community_id IN (
    SELECT c.id FROM public.communities c
    JOIN public.artist_profiles ap ON c.artist_id = ap.id
    WHERE ap.user_id = auth.uid()
  )
);

-- Moderators can view their own assignment
CREATE POLICY "Moderators can view their own assignment"
ON public.community_moderators FOR SELECT
USING (user_id = auth.uid());

-- Anyone can see active moderators (public info)
CREATE POLICY "Anyone can view active moderators"
ON public.community_moderators FOR SELECT
USING (is_active = true);

-- 7. RLS Policies for community_member_events

-- Artists can view events for their community
CREATE POLICY "Artists can view their community member events"
ON public.community_member_events FOR SELECT
USING (
  community_id IN (
    SELECT c.id FROM public.communities c
    JOIN public.artist_profiles ap ON c.artist_id = ap.id
    WHERE ap.user_id = auth.uid()
  )
);

-- System can insert events (via service role or triggers)
CREATE POLICY "Authenticated users can log their own events"
ON public.community_member_events FOR INSERT
WITH CHECK (user_id = auth.uid());