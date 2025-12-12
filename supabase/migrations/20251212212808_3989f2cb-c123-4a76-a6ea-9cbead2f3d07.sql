-- =====================================================
-- PART 1: UNIFIED PLATFORM UPDATES SYSTEM
-- =====================================================

-- Platform updates table with role-based visibility
CREATE TABLE public.platform_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  -- Target roles: array of roles who should see this update
  target_roles TEXT[] NOT NULL DEFAULT ARRAY['admin', 'artist', 'fan'],
  -- Visibility: 'public' or 'admin_only'
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'admin_only')),
  -- Priority for ordering
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  -- Metadata
  link_url TEXT,
  link_text TEXT,
  image_url TEXT,
  -- Status
  is_active BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  -- Audit
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_updates ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage all updates"
ON public.platform_updates
FOR ALL
USING (public.is_admin());

-- Users can view updates based on their roles
CREATE POLICY "Users can view updates for their roles"
ON public.platform_updates
FOR SELECT
USING (
  is_active = true
  AND (expires_at IS NULL OR expires_at > now())
  AND published_at <= now()
  AND (
    -- Admin sees everything
    public.is_admin()
    OR (
      -- Non-admins only see public updates
      visibility = 'public'
      AND (
        -- Check if user's role is in target_roles
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.role::text = ANY(target_roles)
        )
      )
    )
  )
);

-- Index for efficient querying
CREATE INDEX idx_platform_updates_active ON public.platform_updates(is_active, published_at DESC);
CREATE INDEX idx_platform_updates_target_roles ON public.platform_updates USING GIN(target_roles);

-- =====================================================
-- PART 2: SCHEDULED RELEASES SYSTEM
-- =====================================================

-- Add status column to tracks (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tracks' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.tracks ADD COLUMN status TEXT DEFAULT 'public' CHECK (status IN ('draft', 'scheduled', 'public'));
  END IF;
END $$;

-- Add status column to artist_video_posts (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artist_video_posts' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.artist_video_posts ADD COLUMN status TEXT DEFAULT 'public' CHECK (status IN ('draft', 'scheduled', 'public'));
  END IF;
END $$;

-- Release notifications table (for "Get Notified" feature)
CREATE TABLE public.release_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('track', 'video')),
  content_id UUID NOT NULL,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

-- Enable RLS
ALTER TABLE public.release_notifications ENABLE ROW LEVEL SECURITY;

-- Users can manage their own notifications
CREATE POLICY "Users can manage own release notifications"
ON public.release_notifications
FOR ALL
USING (auth.uid() = user_id);

-- Index for efficient querying
CREATE INDEX idx_release_notifications_content ON public.release_notifications(content_type, content_id, notified);

-- Function to process scheduled releases (called by edge function)
CREATE OR REPLACE FUNCTION public.process_scheduled_releases()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  released_tracks INTEGER := 0;
  released_videos INTEGER := 0;
  track_record RECORD;
  video_record RECORD;
  artist_user_id UUID;
  fan_record RECORD;
BEGIN
  -- Process scheduled tracks
  FOR track_record IN
    SELECT t.id, t.title, t.artist_id, ap.artist_name, ap.user_id as artist_user_id
    FROM tracks t
    JOIN artist_profiles ap ON t.artist_id = ap.id
    WHERE t.status = 'scheduled' 
    AND t.release_date IS NOT NULL 
    AND t.release_date <= now()
  LOOP
    -- Update status to public
    UPDATE tracks SET status = 'public', updated_at = now() WHERE id = track_record.id;
    released_tracks := released_tracks + 1;
    
    -- Notify followers
    FOR fan_record IN
      SELECT fan_id FROM follows WHERE artist_id = track_record.artist_id
    LOOP
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (
        fan_record.fan_id,
        'new_release',
        '🎵 New Release!',
        track_record.artist_name || ' just released "' || track_record.title || '"',
        '/artist/' || track_record.artist_id,
        jsonb_build_object('track_id', track_record.id, 'artist_name', track_record.artist_name)
      );
    END LOOP;
    
    -- Notify users who subscribed to this release
    FOR fan_record IN
      SELECT user_id FROM release_notifications 
      WHERE content_type = 'track' AND content_id = track_record.id AND notified = false
    LOOP
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (
        fan_record.user_id,
        'release_reminder',
        '🔔 It''s Here!',
        '"' || track_record.title || '" by ' || track_record.artist_name || ' is now available!',
        '/artist/' || track_record.artist_id,
        jsonb_build_object('track_id', track_record.id, 'artist_name', track_record.artist_name)
      );
      
      UPDATE release_notifications SET notified = true WHERE user_id = fan_record.user_id AND content_type = 'track' AND content_id = track_record.id;
    END LOOP;
  END LOOP;
  
  -- Process scheduled videos
  FOR video_record IN
    SELECT v.id, v.caption, v.artist_id, ap.artist_name, ap.user_id as artist_user_id
    FROM artist_video_posts v
    JOIN artist_profiles ap ON v.artist_id = ap.id
    WHERE v.status = 'scheduled' 
    AND v.release_date IS NOT NULL 
    AND v.release_date <= now()
  LOOP
    -- Update status to public
    UPDATE artist_video_posts SET status = 'public', updated_at = now() WHERE id = video_record.id;
    released_videos := released_videos + 1;
    
    -- Notify followers
    FOR fan_record IN
      SELECT fan_id FROM follows WHERE artist_id = video_record.artist_id
    LOOP
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (
        fan_record.fan_id,
        'new_release',
        '🎬 New Video!',
        video_record.artist_name || ' just released a new video',
        '/artist/' || video_record.artist_id,
        jsonb_build_object('video_id', video_record.id, 'artist_name', video_record.artist_name)
      );
    END LOOP;
    
    -- Notify users who subscribed to this release
    FOR fan_record IN
      SELECT user_id FROM release_notifications 
      WHERE content_type = 'video' AND content_id = video_record.id AND notified = false
    LOOP
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (
        fan_record.user_id,
        'release_reminder',
        '🔔 It''s Here!',
        'New video from ' || video_record.artist_name || ' is now available!',
        '/artist/' || video_record.artist_id,
        jsonb_build_object('video_id', video_record.id, 'artist_name', video_record.artist_name)
      );
      
      UPDATE release_notifications SET notified = true WHERE user_id = fan_record.user_id AND content_type = 'video' AND content_id = video_record.id;
    END LOOP;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'released_tracks', released_tracks,
    'released_videos', released_videos,
    'processed_at', now()
  );
END;
$$;