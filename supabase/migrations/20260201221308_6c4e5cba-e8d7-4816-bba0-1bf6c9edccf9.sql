-- Drop the existing insufficient INSERT policy
DROP POLICY IF EXISTS "Artists can upload own videos" ON storage.objects;

-- Create new policy that validates folder ownership via artist_profile.id
CREATE POLICY "Artists can upload own videos" ON storage.objects
FOR INSERT 
TO public 
WITH CHECK (
  bucket_id = 'artist_videos' 
  AND (storage.foldername(name))[1] IN (
    SELECT (ap.id)::text 
    FROM artist_profiles ap 
    WHERE ap.user_id = auth.uid()
  )
);

-- Drop the existing DELETE policy
DROP POLICY IF EXISTS "Artists can delete own videos" ON storage.objects;

-- Create new DELETE policy with same folder ownership validation
CREATE POLICY "Artists can delete own videos" ON storage.objects
FOR DELETE 
TO public 
USING (
  bucket_id = 'artist_videos' 
  AND (storage.foldername(name))[1] IN (
    SELECT (ap.id)::text 
    FROM artist_profiles ap 
    WHERE ap.user_id = auth.uid()
  )
);