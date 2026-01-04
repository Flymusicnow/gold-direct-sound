-- Create storage bucket for community banners
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-banners',
  'community-banners',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own community banners
CREATE POLICY "Artists can upload community banners"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community-banners' 
  AND (storage.foldername(name))[1] IN (
    SELECT ap.id::text FROM artist_profiles ap WHERE ap.user_id = auth.uid()
  )
);

-- Allow anyone to view community banners (they are public)
CREATE POLICY "Community banners are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'community-banners');

-- Allow artists to update their own banners
CREATE POLICY "Artists can update their community banners"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'community-banners' 
  AND (storage.foldername(name))[1] IN (
    SELECT ap.id::text FROM artist_profiles ap WHERE ap.user_id = auth.uid()
  )
);

-- Allow artists to delete their own banners
CREATE POLICY "Artists can delete their community banners"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'community-banners' 
  AND (storage.foldername(name))[1] IN (
    SELECT ap.id::text FROM artist_profiles ap WHERE ap.user_id = auth.uid()
  )
);