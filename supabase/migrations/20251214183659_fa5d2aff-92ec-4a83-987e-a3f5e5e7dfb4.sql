-- =====================================================
-- PHASE 6: SMART LINKS SECURITY & MONITORING
-- =====================================================

-- 1. Rate limiting tracking table
CREATE TABLE public.smart_link_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'add_link', 'update_link', 'delete_link', 'update_page', 'reorder'
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX idx_rate_limits_artist_window ON smart_link_rate_limits(artist_id, action_type, window_start);

-- RLS for rate limits
ALTER TABLE smart_link_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists can view own rate limits" ON smart_link_rate_limits
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM artist_profiles WHERE id = smart_link_rate_limits.artist_id AND user_id = auth.uid()
  ));

CREATE POLICY "System can insert rate limits" ON smart_link_rate_limits
  FOR INSERT WITH CHECK (true);

-- 2. Rate limit check function
CREATE OR REPLACE FUNCTION check_smart_link_rate_limit(
  _artist_id UUID, 
  _action_type TEXT DEFAULT 'any',
  _max_actions INTEGER DEFAULT 10
) RETURNS BOOLEAN AS $$
DECLARE
  action_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO action_count
  FROM smart_link_rate_limits
  WHERE artist_id = _artist_id
    AND (_action_type = 'any' OR action_type = _action_type)
    AND window_start > NOW() - INTERVAL '24 hours';
  
  RETURN action_count < _max_actions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Record rate limit action function
CREATE OR REPLACE FUNCTION record_smart_link_action(
  _artist_id UUID,
  _action_type TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO smart_link_rate_limits (artist_id, action_type)
  VALUES (_artist_id, _action_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Anomaly alerts table
CREATE TABLE public.smart_link_anomaly_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  smart_link_page_id UUID REFERENCES smart_link_pages(id) ON DELETE CASCADE,
  external_link_id UUID REFERENCES smart_link_external_links(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'ip_abuse', 'burst_traffic', 'bot_pattern'
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  details JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for anomaly alerts (admins only)
ALTER TABLE smart_link_anomaly_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage anomaly alerts" ON smart_link_anomaly_alerts
  FOR ALL USING (is_admin());

-- 5. Add performed_by_role column to audit log if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'smart_link_audit_log' AND column_name = 'performed_by_role') THEN
    ALTER TABLE smart_link_audit_log ADD COLUMN performed_by_role TEXT DEFAULT 'artist';
  END IF;
END $$;

-- 6. Function to notify admins when a link is flagged
CREATE OR REPLACE FUNCTION notify_admins_on_flagged_link()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id UUID;
  artist_name TEXT;
BEGIN
  -- Only trigger when status changes to 'flagged'
  IF NEW.status = 'flagged' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'flagged') THEN
    -- Get artist name for context
    SELECT ap.artist_name INTO artist_name
    FROM artist_profiles ap
    WHERE ap.id = NEW.artist_id;
    
    -- Insert notification for all admins
    FOR admin_user_id IN 
      SELECT user_id FROM user_roles WHERE role IN ('admin', 'super_admin')
    LOOP
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (
        admin_user_id,
        'admin_alert',
        '⚠️ Smart Link Flagged',
        'Auto-flagged link from ' || COALESCE(artist_name, 'Unknown Artist') || ': ' || COALESCE(NEW.flag_reason, 'Unknown reason'),
        '/admin/smart-links',
        jsonb_build_object(
          'link_id', NEW.id,
          'artist_id', NEW.artist_id,
          'platform', NEW.platform,
          'url', NEW.url,
          'flag_reason', NEW.flag_reason
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Create the trigger
DROP TRIGGER IF EXISTS on_link_flagged ON smart_link_external_links;
CREATE TRIGGER on_link_flagged
  AFTER INSERT OR UPDATE ON smart_link_external_links
  FOR EACH ROW EXECUTE FUNCTION notify_admins_on_flagged_link();