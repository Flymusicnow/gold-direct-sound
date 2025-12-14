-- Create inbox_messages table
CREATE TABLE public.inbox_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Identity
  type TEXT NOT NULL DEFAULT 'qa_report',
  title TEXT NOT NULL,
  summary TEXT,
  
  -- Workflow
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'in_progress', 'resolved')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal')),
  
  -- Deduplication (CRITICAL)
  dedupe_key TEXT NOT NULL,
  
  -- Ownership
  assigned_to UUID REFERENCES public.profiles(id),
  
  -- Data
  payload JSONB,
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id),
  resolution_summary TEXT,
  resolution_details JSONB
);

-- CRITICAL: Partial unique index for deduplication
-- Only ONE unresolved message per dedupe_key
CREATE UNIQUE INDEX idx_inbox_messages_dedupe_unresolved 
ON public.inbox_messages (dedupe_key) 
WHERE status != 'resolved';

-- Index for efficient querying
CREATE INDEX idx_inbox_messages_status ON public.inbox_messages (status);
CREATE INDEX idx_inbox_messages_priority ON public.inbox_messages (priority);
CREATE INDEX idx_inbox_messages_created_at ON public.inbox_messages (created_at DESC);

-- Enable RLS
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Admin-only access
CREATE POLICY "Admins can view inbox messages" ON public.inbox_messages
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert inbox messages" ON public.inbox_messages
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update inbox messages" ON public.inbox_messages
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete inbox messages" ON public.inbox_messages
  FOR DELETE USING (is_admin());

-- Create inbox_updates table for timeline
CREATE TABLE public.inbox_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.inbox_messages(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id),
  update_text TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX idx_inbox_updates_message_id ON public.inbox_updates (message_id);
CREATE INDEX idx_inbox_updates_created_at ON public.inbox_updates (created_at);

-- Enable RLS
ALTER TABLE public.inbox_updates ENABLE ROW LEVEL SECURITY;

-- RLS: Admin-only access
CREATE POLICY "Admins can view inbox updates" ON public.inbox_updates
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert inbox updates" ON public.inbox_updates
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update inbox updates" ON public.inbox_updates
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete inbox updates" ON public.inbox_updates
  FOR DELETE USING (is_admin());

-- RPC Function: upsert_inbox_message
-- Handles critical deduplication logic
CREATE OR REPLACE FUNCTION public.upsert_inbox_message(
  _dedupe_key TEXT,
  _title TEXT,
  _summary TEXT,
  _priority TEXT,
  _payload JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id UUID;
  check_count INT;
  new_priority TEXT;
BEGIN
  -- Find existing unresolved message
  SELECT id INTO existing_id
  FROM inbox_messages
  WHERE dedupe_key = _dedupe_key AND status != 'resolved'
  LIMIT 1;
  
  IF existing_id IS NOT NULL THEN
    -- Get check count from existing payload
    SELECT COALESCE((payload->>'check_count')::INT, 1) + 1 INTO check_count
    FROM inbox_messages WHERE id = existing_id;
    
    -- Determine priority (escalate if new priority is higher)
    SELECT CASE
      WHEN _priority = 'critical' THEN 'critical'
      WHEN priority = 'critical' THEN 'critical'
      WHEN _priority = 'high' THEN 'high'
      WHEN priority = 'high' THEN 'high'
      ELSE 'normal'
    END INTO new_priority
    FROM inbox_messages WHERE id = existing_id;
    
    -- Update existing message
    UPDATE inbox_messages SET
      updated_at = NOW(),
      priority = new_priority,
      payload = _payload || jsonb_build_object('check_count', check_count)
    WHERE id = existing_id;
    
    -- Add system update
    INSERT INTO inbox_updates (message_id, update_text, is_system)
    VALUES (existing_id, 'Fortfarande problem (kontrollerat ' || check_count || ' gånger)', true);
    
    RETURN existing_id;
  ELSE
    -- Create new message
    INSERT INTO inbox_messages (dedupe_key, title, summary, priority, payload)
    VALUES (_dedupe_key, _title, _summary, _priority, _payload || jsonb_build_object('check_count', 1))
    RETURNING id INTO existing_id;
    
    -- Add initial system update
    INSERT INTO inbox_updates (message_id, update_text, is_system)
    VALUES (existing_id, 'Nytt problem upptäckt', true);
    
    RETURN existing_id;
  END IF;
END;
$$;

-- Trigger to update updated_at on inbox_messages
CREATE OR REPLACE FUNCTION public.update_inbox_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inbox_messages_updated_at
BEFORE UPDATE ON public.inbox_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_inbox_message_timestamp();