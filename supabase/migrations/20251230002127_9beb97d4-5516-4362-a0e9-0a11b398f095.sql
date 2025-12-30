-- Fix search_path for notify_comment_reply function
CREATE OR REPLACE FUNCTION public.notify_comment_reply()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  original_author_id uuid;
  replier_name text;
BEGIN
  IF NEW.parent_comment_id IS NOT NULL THEN
    SELECT user_id INTO original_author_id 
    FROM public.comments 
    WHERE id = NEW.parent_comment_id;
    
    IF original_author_id IS NOT NULL AND original_author_id != NEW.user_id THEN
      SELECT COALESCE(full_name, 'Someone') INTO replier_name
      FROM public.profiles
      WHERE id = NEW.user_id;
      
      INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
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
$$;

-- Fix search_path for notify_video_comment_reply function
CREATE OR REPLACE FUNCTION public.notify_video_comment_reply()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  original_author_id uuid;
  replier_name text;
BEGIN
  IF NEW.parent_comment_id IS NOT NULL THEN
    SELECT user_id INTO original_author_id 
    FROM public.video_comments 
    WHERE id = NEW.parent_comment_id;
    
    IF original_author_id IS NOT NULL AND original_author_id != NEW.user_id THEN
      SELECT COALESCE(full_name, 'Someone') INTO replier_name
      FROM public.profiles
      WHERE id = NEW.user_id;
      
      INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
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
$$;