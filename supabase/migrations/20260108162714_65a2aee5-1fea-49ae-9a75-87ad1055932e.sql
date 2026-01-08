-- Add new banner columns to artist_profiles
ALTER TABLE public.artist_profiles
ADD COLUMN IF NOT EXISTS banner_url_mobile TEXT,
ADD COLUMN IF NOT EXISTS banner_media_type TEXT DEFAULT 'image',
ADD COLUMN IF NOT EXISTS banner_media_type_mobile TEXT,
ADD COLUMN IF NOT EXISTS banner_crop_data JSONB,
ADD COLUMN IF NOT EXISTS banner_crop_data_mobile JSONB;

-- Create artist-banners storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('artist-banners', 'artist-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public viewing of artist banners
CREATE POLICY "Anyone can view artist banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'artist-banners');

-- Allow authenticated artists to upload their banners
CREATE POLICY "Artists can upload banners"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'artist-banners' AND auth.role() = 'authenticated');

-- Allow artists to update their own banners
CREATE POLICY "Artists can update own banner"
ON storage.objects FOR UPDATE
USING (bucket_id = 'artist-banners' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow artists to delete their own banners
CREATE POLICY "Artists can delete own banner"
ON storage.objects FOR DELETE
USING (bucket_id = 'artist-banners' AND auth.uid()::text = (storage.foldername(name))[1]);