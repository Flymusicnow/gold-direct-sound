-- Create playlists table
CREATE TABLE public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create playlist_tracks table
CREATE TABLE public.playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(playlist_id, track_id)
);

-- Enable RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;

-- RLS policies for playlists
CREATE POLICY "Users can view own playlists"
ON public.playlists
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public playlists"
ON public.playlists
FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can create own playlists"
ON public.playlists
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlists"
ON public.playlists
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists"
ON public.playlists
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for playlist_tracks
CREATE POLICY "Users can view tracks in own playlists"
ON public.playlist_tracks
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.playlists
  WHERE playlists.id = playlist_tracks.playlist_id
  AND playlists.user_id = auth.uid()
));

CREATE POLICY "Anyone can view tracks in public playlists"
ON public.playlist_tracks
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.playlists
  WHERE playlists.id = playlist_tracks.playlist_id
  AND playlists.is_public = true
));

CREATE POLICY "Users can add tracks to own playlists"
ON public.playlist_tracks
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.playlists
  WHERE playlists.id = playlist_tracks.playlist_id
  AND playlists.user_id = auth.uid()
));

CREATE POLICY "Users can delete tracks from own playlists"
ON public.playlist_tracks
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.playlists
  WHERE playlists.id = playlist_tracks.playlist_id
  AND playlists.user_id = auth.uid()
));

-- Add updated_at trigger for playlists
CREATE TRIGGER update_playlists_updated_at
BEFORE UPDATE ON public.playlists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();