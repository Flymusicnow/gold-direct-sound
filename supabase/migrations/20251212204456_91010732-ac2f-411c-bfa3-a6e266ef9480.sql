-- Add new columns to tracks table for multi-upload support
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS upload_batch_id UUID;
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS mood TEXT;
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add new columns to artist_video_posts table for multi-upload support
ALTER TABLE public.artist_video_posts ADD COLUMN IF NOT EXISTS upload_batch_id UUID;
ALTER TABLE public.artist_video_posts ADD COLUMN IF NOT EXISTS mood TEXT;
ALTER TABLE public.artist_video_posts ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create upload_sessions table to track multi-upload progress
CREATE TABLE IF NOT EXISTS public.upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  total_files INTEGER NOT NULL DEFAULT 0,
  completed_files INTEGER DEFAULT 0,
  failed_files INTEGER DEFAULT 0,
  status TEXT DEFAULT 'in_progress',
  file_type TEXT DEFAULT 'mixed'
);

-- Enable RLS on upload_sessions
ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for upload_sessions
CREATE POLICY "Artists can view own upload sessions"
  ON public.upload_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Artists can create own upload sessions"
  ON public.upload_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Artists can update own upload sessions"
  ON public.upload_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all upload sessions"
  ON public.upload_sessions
  FOR SELECT
  USING (is_admin());

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_tracks_upload_batch_id ON public.tracks(upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_videos_upload_batch_id ON public.artist_video_posts(upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_artist_id ON public.upload_sessions(artist_id);