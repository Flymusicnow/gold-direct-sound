-- Add youtube_url column to artist_profiles
ALTER TABLE public.artist_profiles 
ADD COLUMN IF NOT EXISTS youtube_url text;