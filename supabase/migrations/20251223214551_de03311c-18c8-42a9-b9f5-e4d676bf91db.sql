-- Add attachments column to inbox_messages
ALTER TABLE public.inbox_messages
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- Create storage bucket for issue screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-screenshots', 'issue-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: Allow authenticated users to upload to issue-screenshots
CREATE POLICY "Authenticated users can upload issue screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'issue-screenshots');

-- RLS: Allow public read access (public bucket)
CREATE POLICY "Public can view issue screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'issue-screenshots');

-- RLS: Allow authenticated users to delete their own uploads
CREATE POLICY "Users can delete own issue screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'issue-screenshots');