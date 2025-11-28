-- Create video_views table for analytics tracking
CREATE TABLE public.video_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.artist_video_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  watch_duration_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  referrer_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add analytics columns to artist_video_posts
ALTER TABLE public.artist_video_posts 
ADD COLUMN view_count INTEGER DEFAULT 0,
ADD COLUMN duration_seconds INTEGER;

-- Create video_comments table
CREATE TABLE public.video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.artist_video_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  text TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.video_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create video_comment_likes table
CREATE TABLE public.video_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.video_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Create video_collections table
CREATE TABLE public.video_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create video_collection_items table
CREATE TABLE public.video_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.video_collections(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.artist_video_posts(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(collection_id, video_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_collection_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_views
CREATE POLICY "Anyone can create views"
ON public.video_views FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view own views"
ON public.video_views FOR SELECT
USING (user_id = auth.uid() OR user_id IS NULL);

-- RLS Policies for video_comments
CREATE POLICY "Anyone can view comments on approved artist videos"
ON public.video_comments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.artist_video_posts avp
  JOIN public.artist_profiles ap ON avp.artist_id = ap.id
  WHERE avp.id = video_comments.video_id AND ap.status = 'approved'
));

CREATE POLICY "Authenticated users can create comments"
ON public.video_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON public.video_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.video_comments FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for video_comment_likes
CREATE POLICY "Anyone can view comment likes"
ON public.video_comment_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like comments"
ON public.video_comment_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
ON public.video_comment_likes FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for video_collections
CREATE POLICY "Anyone can view collections from approved artists"
ON public.video_collections FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.artist_profiles ap
  WHERE ap.id = video_collections.artist_id AND ap.status = 'approved'
));

CREATE POLICY "Artists can manage own collections"
ON public.video_collections FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.artist_profiles ap
  WHERE ap.id = video_collections.artist_id AND ap.user_id = auth.uid()
));

-- RLS Policies for video_collection_items
CREATE POLICY "Anyone can view collection items from approved artists"
ON public.video_collection_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.video_collections vc
  JOIN public.artist_profiles ap ON vc.artist_id = ap.id
  WHERE vc.id = video_collection_items.collection_id AND ap.status = 'approved'
));

CREATE POLICY "Artists can manage own collection items"
ON public.video_collection_items FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.video_collections vc
  JOIN public.artist_profiles ap ON vc.artist_id = ap.id
  WHERE vc.id = video_collection_items.collection_id AND ap.user_id = auth.uid()
));

-- Create function to notify fans on new video
CREATE OR REPLACE FUNCTION public.notify_fans_on_new_video()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  artist_name_var TEXT;
  fan_record RECORD;
BEGIN
  -- Get artist name
  SELECT artist_name INTO artist_name_var
  FROM artist_profiles WHERE id = NEW.artist_id;
  
  -- Notify all fans following this artist
  FOR fan_record IN 
    SELECT fan_id FROM follows WHERE artist_id = NEW.artist_id
  LOOP
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      fan_record.fan_id,
      'new_video',
      '🎬 New Video!',
      artist_name_var || ' just posted a new video',
      '/artist/' || NEW.artist_id,
      jsonb_build_object('video_id', NEW.id, 'artist_name', artist_name_var)
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new video notifications
CREATE TRIGGER on_video_insert
AFTER INSERT ON public.artist_video_posts
FOR EACH ROW EXECUTE FUNCTION public.notify_fans_on_new_video();

-- Create trigger for updating video_comments updated_at
CREATE TRIGGER update_video_comments_updated_at
BEFORE UPDATE ON public.video_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating video_collections updated_at
CREATE TRIGGER update_video_collections_updated_at
BEFORE UPDATE ON public.video_collections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime on new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_comment_likes;