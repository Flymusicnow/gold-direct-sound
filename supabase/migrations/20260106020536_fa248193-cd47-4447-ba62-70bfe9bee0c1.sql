-- Fan engagement scores table for leaderboard
CREATE TABLE public.fan_engagement_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Score components
  comment_count INTEGER DEFAULT 0,
  reaction_given_count INTEGER DEFAULT 0,
  reaction_received_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  
  -- Weighted total score
  total_score INTEGER DEFAULT 0,
  
  -- Ranking
  rank INTEGER,
  previous_rank INTEGER,
  
  -- Timestamps
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(community_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_engagement_community_score ON public.fan_engagement_scores(community_id, total_score DESC);
CREATE INDEX idx_engagement_community_rank ON public.fan_engagement_scores(community_id, rank);
CREATE INDEX idx_engagement_user ON public.fan_engagement_scores(user_id);

-- Enable RLS
ALTER TABLE public.fan_engagement_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies - anyone can view leaderboard, users can see their own detailed stats
CREATE POLICY "Anyone can view engagement scores"
  ON public.fan_engagement_scores FOR SELECT
  USING (true);

CREATE POLICY "System can manage engagement scores"
  ON public.fan_engagement_scores FOR ALL
  USING (auth.uid() = user_id);

-- Community notification preferences table
CREATE TABLE public.community_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  
  -- Preference flags
  notify_new_posts BOOLEAN DEFAULT true,
  notify_pinned_posts BOOLEAN DEFAULT true,
  notify_artist_posts BOOLEAN DEFAULT true,
  notify_mentions BOOLEAN DEFAULT true,
  notify_replies BOOLEAN DEFAULT true,
  
  -- Delivery method
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, community_id)
);

-- Enable RLS
ALTER TABLE public.community_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only manage their own preferences
CREATE POLICY "Users can view own notification preferences"
  ON public.community_notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON public.community_notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON public.community_notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification preferences"
  ON public.community_notification_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update engagement score when comments are added/removed
CREATE OR REPLACE FUNCTION public.update_engagement_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_community_id UUID;
  v_is_reply BOOLEAN;
BEGIN
  -- Get community_id from the post
  IF TG_OP = 'DELETE' THEN
    SELECT community_id INTO v_community_id FROM community_posts WHERE id = OLD.post_id;
    v_is_reply := OLD.parent_comment_id IS NOT NULL;
    
    -- Update or create engagement score
    INSERT INTO fan_engagement_scores (community_id, user_id, comment_count, reply_count, total_score, last_activity_at)
    VALUES (v_community_id, OLD.author_id, 
            CASE WHEN v_is_reply THEN 0 ELSE -1 END,
            CASE WHEN v_is_reply THEN -1 ELSE 0 END,
            CASE WHEN v_is_reply THEN -3 ELSE -5 END,
            now())
    ON CONFLICT (community_id, user_id) DO UPDATE SET
      comment_count = GREATEST(0, fan_engagement_scores.comment_count + CASE WHEN v_is_reply THEN 0 ELSE -1 END),
      reply_count = GREATEST(0, fan_engagement_scores.reply_count + CASE WHEN v_is_reply THEN -1 ELSE 0 END),
      total_score = GREATEST(0, fan_engagement_scores.total_score + CASE WHEN v_is_reply THEN -3 ELSE -5 END),
      updated_at = now();
  ELSE
    SELECT community_id INTO v_community_id FROM community_posts WHERE id = NEW.post_id;
    v_is_reply := NEW.parent_comment_id IS NOT NULL;
    
    -- Update or create engagement score
    INSERT INTO fan_engagement_scores (community_id, user_id, comment_count, reply_count, total_score, last_activity_at)
    VALUES (v_community_id, NEW.author_id, 
            CASE WHEN v_is_reply THEN 0 ELSE 1 END,
            CASE WHEN v_is_reply THEN 1 ELSE 0 END,
            CASE WHEN v_is_reply THEN 3 ELSE 5 END,
            now())
    ON CONFLICT (community_id, user_id) DO UPDATE SET
      comment_count = fan_engagement_scores.comment_count + CASE WHEN v_is_reply THEN 0 ELSE 1 END,
      reply_count = fan_engagement_scores.reply_count + CASE WHEN v_is_reply THEN 1 ELSE 0 END,
      total_score = fan_engagement_scores.total_score + CASE WHEN v_is_reply THEN 3 ELSE 5 END,
      last_activity_at = now(),
      updated_at = now();
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update engagement score when reactions are added/removed
CREATE OR REPLACE FUNCTION public.update_engagement_on_reaction()
RETURNS TRIGGER AS $$
DECLARE
  v_community_id UUID;
  v_post_author_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Get community_id and post author from the post
    SELECT community_id, author_id INTO v_community_id, v_post_author_id 
    FROM community_posts WHERE id = OLD.post_id;
    
    -- Update reactor's score (reaction given)
    INSERT INTO fan_engagement_scores (community_id, user_id, reaction_given_count, total_score, last_activity_at)
    VALUES (v_community_id, OLD.user_id, -1, -1, now())
    ON CONFLICT (community_id, user_id) DO UPDATE SET
      reaction_given_count = GREATEST(0, fan_engagement_scores.reaction_given_count - 1),
      total_score = GREATEST(0, fan_engagement_scores.total_score - 1),
      updated_at = now();
    
    -- Update post author's score (reaction received)
    IF v_post_author_id IS NOT NULL THEN
      INSERT INTO fan_engagement_scores (community_id, user_id, reaction_received_count, total_score, last_activity_at)
      VALUES (v_community_id, v_post_author_id, -1, -2, now())
      ON CONFLICT (community_id, user_id) DO UPDATE SET
        reaction_received_count = GREATEST(0, fan_engagement_scores.reaction_received_count - 1),
        total_score = GREATEST(0, fan_engagement_scores.total_score - 2),
        updated_at = now();
    END IF;
  ELSE
    -- Get community_id and post author from the post
    SELECT community_id, author_id INTO v_community_id, v_post_author_id 
    FROM community_posts WHERE id = NEW.post_id;
    
    -- Update reactor's score (reaction given)
    INSERT INTO fan_engagement_scores (community_id, user_id, reaction_given_count, total_score, last_activity_at)
    VALUES (v_community_id, NEW.user_id, 1, 1, now())
    ON CONFLICT (community_id, user_id) DO UPDATE SET
      reaction_given_count = fan_engagement_scores.reaction_given_count + 1,
      total_score = fan_engagement_scores.total_score + 1,
      last_activity_at = now(),
      updated_at = now();
    
    -- Update post author's score (reaction received)
    IF v_post_author_id IS NOT NULL THEN
      INSERT INTO fan_engagement_scores (community_id, user_id, reaction_received_count, total_score, last_activity_at)
      VALUES (v_community_id, v_post_author_id, 1, 2, now())
      ON CONFLICT (community_id, user_id) DO UPDATE SET
        reaction_received_count = fan_engagement_scores.reaction_received_count + 1,
        total_score = fan_engagement_scores.total_score + 2,
        last_activity_at = now(),
        updated_at = now();
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify community subscribers on new/pinned posts
CREATE OR REPLACE FUNCTION public.notify_community_on_post()
RETURNS TRIGGER AS $$
DECLARE
  v_artist_id UUID;
  v_artist_name TEXT;
  v_notification_type TEXT;
  v_title TEXT;
  v_message TEXT;
BEGIN
  -- Get artist info
  SELECT c.artist_id, ap.artist_name INTO v_artist_id, v_artist_name
  FROM communities c
  JOIN artist_profiles ap ON ap.id = c.artist_id
  WHERE c.id = NEW.community_id;
  
  -- Check if post was just pinned
  IF TG_OP = 'UPDATE' AND NEW.is_pinned = true AND (OLD.is_pinned = false OR OLD.is_pinned IS NULL) THEN
    v_notification_type := 'community_pinned_post';
    v_title := 'Pinned Announcement';
    v_message := v_artist_name || ' pinned an important announcement';
  ELSIF TG_OP = 'INSERT' AND NEW.author_type = 'artist' THEN
    v_notification_type := 'community_new_post';
    v_title := 'New Post from ' || v_artist_name;
    v_message := LEFT(NEW.content, 100);
  ELSE
    RETURN NEW;
  END IF;
  
  -- Create notifications for subscribers who have the preference enabled
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  SELECT 
    cnp.user_id,
    v_notification_type,
    v_title,
    v_message,
    '/artist/' || v_artist_id || '/community',
    jsonb_build_object('post_id', NEW.id, 'community_id', NEW.community_id, 'artist_id', v_artist_id)
  FROM community_notification_preferences cnp
  WHERE cnp.community_id = NEW.community_id
    AND cnp.user_id != NEW.author_id
    AND (
      (v_notification_type = 'community_pinned_post' AND cnp.notify_pinned_posts = true)
      OR (v_notification_type = 'community_new_post' AND cnp.notify_artist_posts = true)
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers (check if post_comments table exists first)
DO $$
BEGIN
  -- Trigger for post_comments if exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_comments' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS trigger_engagement_on_comment ON public.post_comments;
    CREATE TRIGGER trigger_engagement_on_comment
      AFTER INSERT OR DELETE ON public.post_comments
      FOR EACH ROW EXECUTE FUNCTION public.update_engagement_on_comment();
  END IF;
  
  -- Trigger for post_reactions if exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_reactions' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS trigger_engagement_on_reaction ON public.post_reactions;
    CREATE TRIGGER trigger_engagement_on_reaction
      AFTER INSERT OR DELETE ON public.post_reactions
      FOR EACH ROW EXECUTE FUNCTION public.update_engagement_on_reaction();
  END IF;
END $$;

-- Trigger for community_posts notifications
DROP TRIGGER IF EXISTS trigger_notify_community_on_post ON public.community_posts;
CREATE TRIGGER trigger_notify_community_on_post
  AFTER INSERT OR UPDATE OF is_pinned ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_community_on_post();

-- Enable realtime for fan_engagement_scores for live leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.fan_engagement_scores;