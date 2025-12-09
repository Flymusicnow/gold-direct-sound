-- Add cover_url column to playlists table for custom playlist cover images
ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS cover_url TEXT;