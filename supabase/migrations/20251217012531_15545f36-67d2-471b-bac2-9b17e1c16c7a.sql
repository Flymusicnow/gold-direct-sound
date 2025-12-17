-- Update upsert_inbox_message function to accept _type parameter
CREATE OR REPLACE FUNCTION public.upsert_inbox_message(
  _dedupe_key TEXT,
  _title TEXT,
  _type TEXT,
  _summary TEXT,
  _priority TEXT,
  _payload JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_id UUID;
  new_id UUID;
BEGIN
  -- Check for existing unresolved message with same dedupe_key
  SELECT id INTO existing_id
  FROM inbox_messages
  WHERE dedupe_key = _dedupe_key
    AND status != 'resolved';
  
  IF existing_id IS NOT NULL THEN
    -- Update existing message
    UPDATE inbox_messages
    SET 
      title = _title,
      type = _type,
      summary = _summary,
      priority = _priority,
      payload = _payload,
      updated_at = NOW()
    WHERE id = existing_id;
    
    RETURN existing_id;
  ELSE
    -- Insert new message
    INSERT INTO inbox_messages (dedupe_key, title, type, summary, priority, payload)
    VALUES (_dedupe_key, _title, _type, _summary, _priority, _payload)
    RETURNING id INTO new_id;
    
    RETURN new_id;
  END IF;
END;
$function$;