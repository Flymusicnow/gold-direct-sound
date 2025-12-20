-- Fix notify_on_reply function to use artist_profiles.user_id for notification links
-- Previously it was using artist_profiles.id which is the artist profile ID, not the user ID
-- The route /artist/:id expects a user_id, not an artist_profiles.id

CREATE OR REPLACE FUNCTION public.notify_on_reply()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  parent_author_id UUID;
  replier_name TEXT;
  artist_user_id UUID;
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

  -- Get the artist's user_id (not the artist_profiles.id)
  SELECT user_id INTO artist_user_id
  FROM artist_profiles
  WHERE id = NEW.artist_id;

  -- Insert notification with correct user_id in link
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    parent_author_id,
    'comment_reply',
    'New Reply',
    replier_name || ' replied to your comment',
    '/artist/' || artist_user_id
  );

  RETURN NEW;
END;
$function$;