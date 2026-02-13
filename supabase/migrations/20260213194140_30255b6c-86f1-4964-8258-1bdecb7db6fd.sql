
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  track_id uuid,
  session_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes for query performance
CREATE INDEX idx_events_user_created ON public.events (user_id, created_at DESC);
CREATE INDEX idx_events_track_created ON public.events (track_id, created_at DESC);
CREATE INDEX idx_events_type_created ON public.events (event_type, created_at DESC);

-- RLS: append-only for authenticated users (insert own, no update/delete)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin read-only access
CREATE POLICY "Admins can read all events"
  ON public.events FOR SELECT TO authenticated
  USING (public.is_admin());
