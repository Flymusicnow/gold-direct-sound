-- Create artist_video_posts table
CREATE TABLE public.artist_video_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.artist_video_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view videos from approved artists
CREATE POLICY "Anyone can view videos from approved artists"
ON public.artist_video_posts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.artist_profiles
    WHERE artist_profiles.id = artist_video_posts.artist_id
    AND artist_profiles.status = 'approved'
  )
);

-- Policy: Artists can manage their own videos
CREATE POLICY "Artists can manage own videos"
ON public.artist_video_posts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.artist_profiles
    WHERE artist_profiles.id = artist_video_posts.artist_id
    AND artist_profiles.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_artist_video_posts_updated_at
BEFORE UPDATE ON public.artist_video_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for artist videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('artist_videos', 'artist_videos', true);

-- Storage policy: Anyone can view videos
CREATE POLICY "Anyone can view artist videos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'artist_videos');

-- Storage policy: Artists can upload their own videos
CREATE POLICY "Artists can upload own videos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'artist_videos' AND
  auth.uid() IS NOT NULL
);

-- Storage policy: Artists can delete their own videos
CREATE POLICY "Artists can delete own videos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'artist_videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);