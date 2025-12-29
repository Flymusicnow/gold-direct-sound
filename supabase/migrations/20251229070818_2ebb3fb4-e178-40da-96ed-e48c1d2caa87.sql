-- Create telemetry_events table for Flight Recorder system
CREATE TABLE public.telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id TEXT NOT NULL,
  flow TEXT NOT NULL,
  step TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('start', 'ok', 'warn', 'fail', 'end', 'skip')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms INTEGER,
  user_id UUID,
  session_id TEXT NOT NULL,
  location TEXT NOT NULL,
  meta JSONB DEFAULT '{}',
  decoded_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast querying
CREATE INDEX idx_telemetry_trace_id ON public.telemetry_events(trace_id);
CREATE INDEX idx_telemetry_flow ON public.telemetry_events(flow);
CREATE INDEX idx_telemetry_status ON public.telemetry_events(status);
CREATE INDEX idx_telemetry_timestamp ON public.telemetry_events(timestamp DESC);
CREATE INDEX idx_telemetry_user_id ON public.telemetry_events(user_id);

-- Enable RLS
ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert telemetry (fire-and-forget logging)
CREATE POLICY "Anyone can insert telemetry" 
ON public.telemetry_events 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view telemetry
CREATE POLICY "Admins can view telemetry" 
ON public.telemetry_events 
FOR SELECT 
USING (is_admin());

-- Only admins can delete old telemetry (cleanup)
CREATE POLICY "Admins can delete telemetry" 
ON public.telemetry_events 
FOR DELETE 
USING (is_admin());