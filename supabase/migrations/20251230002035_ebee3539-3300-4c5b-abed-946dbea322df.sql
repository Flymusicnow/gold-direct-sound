-- Add moderation columns to comments table
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reported_at timestamptz,
ADD COLUMN IF NOT EXISTS reported_by uuid;

-- Add moderation columns to video_comments table
ALTER TABLE video_comments 
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reported_at timestamptz,
ADD COLUMN IF NOT EXISTS reported_by uuid;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_comments_pinned ON comments(artist_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_video_comments_pinned ON video_comments(video_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_comments_reported ON comments(reported_at) WHERE reported_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_video_comments_reported ON video_comments(reported_at) WHERE reported_at IS NOT NULL;

-- Function to create notification when someone replies to an artist profile comment
CREATE OR REPLACE FUNCTION notify_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
  original_author_id uuid;
  replier_name text;
BEGIN
  -- Only trigger for replies (comments with parent_comment_id)
  IF NEW.parent_comment_id IS NOT NULL THEN
    -- Get original comment author
    SELECT user_id INTO original_author_id 
    FROM comments 
    WHERE id = NEW.parent_comment_id;
    
    -- Don't notify if replying to own comment
    IF original_author_id IS NOT NULL AND original_author_id != NEW.user_id THEN
      -- Get replier name
      SELECT COALESCE(full_name, 'Someone') INTO replier_name
      FROM profiles
      WHERE id = NEW.user_id;
      
      -- Create notification
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (
        original_author_id,
        'comment_reply',
        'New reply to your comment',
        replier_name || ' replied to your comment',
        '/artist/' || NEW.artist_id,
        jsonb_build_object(
          'comment_id', NEW.id,
          'parent_comment_id', NEW.parent_comment_id,
          'replier_id', NEW.user_id
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for artist profile comments
DROP TRIGGER IF EXISTS on_comment_reply ON comments;
CREATE TRIGGER on_comment_reply
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION notify_comment_reply();

-- Function for video comment replies
CREATE OR REPLACE FUNCTION notify_video_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
  original_author_id uuid;
  replier_name text;
BEGIN
  IF NEW.parent_comment_id IS NOT NULL THEN
    SELECT user_id INTO original_author_id 
    FROM video_comments 
    WHERE id = NEW.parent_comment_id;
    
    IF original_author_id IS NOT NULL AND original_author_id != NEW.user_id THEN
      SELECT COALESCE(full_name, 'Someone') INTO replier_name
      FROM profiles
      WHERE id = NEW.user_id;
      
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (
        original_author_id,
        'comment_reply',
        'New reply to your comment',
        replier_name || ' replied to your comment on a video',
        '/watch/' || NEW.video_id,
        jsonb_build_object(
          'comment_id', NEW.id,
          'parent_comment_id', NEW.parent_comment_id,
          'replier_id', NEW.user_id,
          'video_id', NEW.video_id
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for video comments
DROP TRIGGER IF EXISTS on_video_comment_reply ON video_comments;
CREATE TRIGGER on_video_comment_reply
AFTER INSERT ON video_comments
FOR EACH ROW
EXECUTE FUNCTION notify_video_comment_reply();

-- RLS policy for artists to moderate comments on their profile
DROP POLICY IF EXISTS "Artists can moderate comments on their profile" ON comments;
CREATE POLICY "Artists can moderate comments on their profile"
ON comments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM artist_profiles 
    WHERE id = comments.artist_id 
    AND user_id = auth.uid()
  )
);

-- RLS policy for artists to moderate video comments
DROP POLICY IF EXISTS "Artists can moderate comments on their videos" ON video_comments;
CREATE POLICY "Artists can moderate comments on their videos"
ON video_comments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM artist_video_posts av
    JOIN artist_profiles ap ON av.artist_id = ap.id
    WHERE av.id = video_comments.video_id 
    AND ap.user_id = auth.uid()
  )
);