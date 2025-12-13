-- Create albums table for proper album management
CREATE TABLE public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  release_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add album_id and track_order to tracks table
ALTER TABLE public.tracks ADD COLUMN album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL;
ALTER TABLE public.tracks ADD COLUMN track_order INTEGER DEFAULT 0;

-- Enable RLS on albums
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

-- RLS policies for albums
CREATE POLICY "Anyone can view albums from approved artists"
ON public.albums FOR SELECT
USING (EXISTS (
  SELECT 1 FROM artist_profiles
  WHERE artist_profiles.id = albums.artist_id
  AND artist_profiles.status = 'approved'
));

CREATE POLICY "Artists can manage own albums"
ON public.albums FOR ALL
USING (EXISTS (
  SELECT 1 FROM artist_profiles
  WHERE artist_profiles.id = albums.artist_id
  AND artist_profiles.user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_albums_updated_at
BEFORE UPDATE ON public.albums
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();