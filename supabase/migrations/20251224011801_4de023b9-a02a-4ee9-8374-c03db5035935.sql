-- Create storage bucket for entity icons
INSERT INTO storage.buckets (id, name, public)
VALUES ('entity-icons', 'entity-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads to entity-icons"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'entity-icons');

-- Policy: Allow public read access
CREATE POLICY "Allow public read access to entity-icons"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'entity-icons');

-- Policy: Allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated updates to entity-icons"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'entity-icons');

-- Policy: Allow authenticated users to delete
CREATE POLICY "Allow authenticated deletes from entity-icons"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'entity-icons');