-- Create auth_email_events table for logging and rate limiting
CREATE TABLE public.auth_email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID,
  email_hash TEXT NOT NULL,
  event TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  error_code TEXT,
  correlation_id TEXT NOT NULL
);

-- Index for rate limiting queries (email_hash + event + time window)
CREATE INDEX idx_auth_email_events_rate_limit 
  ON auth_email_events(email_hash, event, created_at DESC);

-- Index for correlation ID lookups
CREATE INDEX idx_auth_email_events_correlation 
  ON auth_email_events(correlation_id);

-- Enable RLS
ALTER TABLE auth_email_events ENABLE ROW LEVEL SECURITY;

-- Admin-only read access policy
CREATE POLICY "Admin read auth_email_events"
  ON auth_email_events FOR SELECT
  TO authenticated
  USING (public.is_admin());