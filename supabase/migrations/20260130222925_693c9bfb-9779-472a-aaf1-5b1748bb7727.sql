-- Create spotlight_entry_comments table
CREATE TABLE public.spotlight_entry_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.spotlight_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.spotlight_entry_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read non-deleted comments
CREATE POLICY "Anyone can read comments"
  ON public.spotlight_entry_comments
  FOR SELECT
  USING (is_deleted = false);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON public.spotlight_entry_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can soft-delete their own comments
CREATE POLICY "Users can update own comments"
  ON public.spotlight_entry_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_spotlight_entry_comments_entry_id ON public.spotlight_entry_comments(entry_id);
CREATE INDEX idx_spotlight_entry_comments_created_at ON public.spotlight_entry_comments(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.spotlight_entry_comments;