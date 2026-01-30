-- Create post_comment_likes table for community comment likes
CREATE TABLE IF NOT EXISTS public.post_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_post_comment_likes_comment ON public.post_comment_likes(comment_id);
CREATE INDEX idx_post_comment_likes_user ON public.post_comment_likes(user_id);

-- Enable RLS
ALTER TABLE public.post_comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read all post comment likes"
  ON public.post_comment_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like post comments"
  ON public.post_comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own post comment likes"
  ON public.post_comment_likes FOR DELETE
  USING (auth.uid() = user_id);