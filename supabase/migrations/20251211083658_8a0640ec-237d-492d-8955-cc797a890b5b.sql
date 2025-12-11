-- Create trigger to notify artist when someone comments on their profile
CREATE OR REPLACE FUNCTION public.notify_artist_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  artist_user_id UUID;
  commenter_name TEXT;
BEGIN
  -- Get artist's user_id
  SELECT ap.user_id INTO artist_user_id
  FROM artist_profiles ap
  WHERE ap.id = NEW.artist_id;

  -- Don't notify if artist comments on own profile
  IF artist_user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get commenter's name
  SELECT COALESCE(full_name, 'Someone') INTO commenter_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Insert notification
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    artist_user_id,
    'new_comment',
    'New Comment',
    commenter_name || ' commented on your profile',
    '/studio/comments'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_comment_insert ON comments;

-- Create trigger
CREATE TRIGGER on_comment_insert
  AFTER INSERT ON comments
  FOR EACH ROW
  WHEN (NEW.parent_comment_id IS NULL)
  EXECUTE FUNCTION public.notify_artist_on_comment();

-- Create trigger to notify parent comment author when someone replies
CREATE OR REPLACE FUNCTION public.notify_on_reply()
RETURNS TRIGGER AS $$
DECLARE
  parent_author_id UUID;
  replier_name TEXT;
BEGIN
  -- Only process replies
  IF NEW.parent_comment_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get parent comment author
  SELECT user_id INTO parent_author_id
  FROM comments
  WHERE id = NEW.parent_comment_id;

  -- Don't notify if replying to own comment
  IF parent_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get replier's name
  SELECT COALESCE(full_name, 'Someone') INTO replier_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Insert notification
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    parent_author_id,
    'comment_reply',
    'New Reply',
    replier_name || ' replied to your comment',
    '/artist/' || NEW.artist_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_reply_insert ON comments;

-- Create trigger for replies
CREATE TRIGGER on_reply_insert
  AFTER INSERT ON comments
  FOR EACH ROW
  WHEN (NEW.parent_comment_id IS NOT NULL)
  EXECUTE FUNCTION public.notify_on_reply();