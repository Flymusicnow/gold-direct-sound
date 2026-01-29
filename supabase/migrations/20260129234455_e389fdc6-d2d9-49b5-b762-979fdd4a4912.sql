-- Add severity column to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info' 
CHECK (severity IN ('info', 'important'));

-- Add index for type queries
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Create trigger function for issue resolution notifications
CREATE OR REPLACE FUNCTION public.notify_reporter_on_issue_resolved()
RETURNS TRIGGER AS $$
DECLARE
  reporter_user_id UUID;
BEGIN
  -- Only trigger on status change to 'resolved' or 'verified'
  IF (NEW.status IN ('resolved', 'verified') AND 
      (OLD.status IS NULL OR OLD.status NOT IN ('resolved', 'verified'))) THEN
    
    -- Get reporter_id from payload (contextual_report)
    reporter_user_id := (NEW.payload->'ai_context'->>'user_id')::UUID;
    
    IF reporter_user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, link, metadata, severity)
      VALUES (
        reporter_user_id,
        'issue_fixed',
        '✅ Your reported issue has been fixed!',
        COALESCE(NEW.resolution_summary, 'The issue you reported has been resolved.'),
        '/studio/dashboard',
        jsonb_build_object(
          'inbox_id', NEW.id,
          'resolved_at', NEW.resolved_at
        ),
        'important'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on inbox_messages
DROP TRIGGER IF EXISTS on_inbox_resolved_notify_reporter ON inbox_messages;
CREATE TRIGGER on_inbox_resolved_notify_reporter
  AFTER UPDATE OF status ON inbox_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_reporter_on_issue_resolved();

-- Create RPC function for admin to send notifications
CREATE OR REPLACE FUNCTION public.send_admin_notification(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_target_user_ids UUID[] DEFAULT NULL,
  p_target_role TEXT DEFAULT NULL,
  p_link TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'info'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
  inserted_count INTEGER := 0;
BEGIN
  -- Verify caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can send notifications';
  END IF;
  
  -- If specific user_ids provided
  IF p_target_user_ids IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, severity)
    SELECT unnest(p_target_user_ids), p_type, p_title, p_message, p_link, p_severity;
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
  -- If target_role provided (e.g. 'artist')
  ELSIF p_target_role IS NOT NULL THEN
    FOR user_record IN 
      SELECT DISTINCT user_id FROM user_roles WHERE role::text = p_target_role
    LOOP
      INSERT INTO notifications (user_id, type, title, message, link, severity)
      VALUES (user_record.user_id, p_type, p_title, p_message, p_link, p_severity);
      inserted_count := inserted_count + 1;
    END LOOP;
  END IF;
  
  RETURN inserted_count;
END;
$$;