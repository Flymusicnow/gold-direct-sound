-- Update the notify_reporter_on_issue_resolved function to use dynamic routing based on user role
CREATE OR REPLACE FUNCTION public.notify_reporter_on_issue_resolved()
RETURNS TRIGGER AS $$
DECLARE
  reporter_user_id UUID;
  reporter_role TEXT;
  original_route TEXT;
  notification_link TEXT;
BEGIN
  IF (NEW.status IN ('resolved', 'verified') AND 
      (OLD.status IS NULL OR OLD.status NOT IN ('resolved', 'verified'))) THEN
    
    reporter_user_id := (NEW.payload->'ai_context'->>'user_id')::UUID;
    reporter_role := NEW.payload->'ai_context'->>'user_role';
    original_route := NEW.payload->'ai_context'->>'route';
    
    -- Determine link based on role and original route
    notification_link := CASE
      WHEN original_route IS NOT NULL AND original_route != '' THEN original_route
      WHEN reporter_role = 'fan' THEN '/fan/dashboard'
      WHEN reporter_role = 'artist' THEN '/studio/dashboard'
      WHEN reporter_role = 'brand' THEN '/brand/dashboard'
      ELSE '/role-selection'
    END;
    
    IF reporter_user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, link, metadata, severity)
      VALUES (
        reporter_user_id,
        'issue_fixed',
        '✅ Your reported issue has been fixed!',
        COALESCE(NEW.resolution_summary, 'The issue you reported has been resolved.'),
        notification_link,
        jsonb_build_object(
          'inbox_id', NEW.id,
          'resolved_at', NEW.resolved_at,
          'original_route', original_route
        ),
        'important'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;