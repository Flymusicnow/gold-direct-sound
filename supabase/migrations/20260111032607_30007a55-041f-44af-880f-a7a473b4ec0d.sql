-- 1. Add stream_mode to artist_live_streams (replacing webrtc_enabled concept)
ALTER TABLE artist_live_streams
ADD COLUMN IF NOT EXISTS stream_mode text DEFAULT 'hls' 
  CHECK (stream_mode IN ('hls', 'webrtc_interactive', 'webrtc_sfu'));

-- Add HLS-specific fields for quality selection
ALTER TABLE artist_live_streams
ADD COLUMN IF NOT EXISTS hls_url text,
ADD COLUMN IF NOT EXISTS available_qualities jsonb DEFAULT '["auto", "360p", "480p", "720p", "1080p"]';

-- 2. Create Fan-on-Stage request table (queue-based system)
CREATE TABLE IF NOT EXISTS live_stage_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES artist_live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'on_stage', 'kicked')),
  requested_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  denied_at timestamptz,
  kicked_at timestamptz,
  kick_reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE live_stage_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own requests
CREATE POLICY "Users can view own stage requests" ON live_stage_requests 
  FOR SELECT USING (auth.uid() = user_id);

-- Artists can view all requests for their streams
CREATE POLICY "Artists can view stream requests" ON live_stage_requests 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM artist_live_streams als
      JOIN artist_profiles ap ON als.artist_id = ap.id
      WHERE als.id = live_stage_requests.stream_id 
      AND ap.user_id = auth.uid()
    )
  );

-- Users can create requests (rate limited by unique constraint logic in app)
CREATE POLICY "Users can create stage requests" ON live_stage_requests 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Artists can update requests for their streams
CREATE POLICY "Artists can manage stage requests" ON live_stage_requests 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM artist_live_streams als
      JOIN artist_profiles ap ON als.artist_id = ap.id
      WHERE als.id = live_stage_requests.stream_id 
      AND ap.user_id = auth.uid()
    )
  );

-- Enable realtime for request updates
ALTER PUBLICATION supabase_realtime ADD TABLE live_stage_requests;

-- 3. Create secure WebRTC signaling table (signals visible only to sender and target)
CREATE TABLE IF NOT EXISTS webrtc_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type text NOT NULL CHECK (signal_type IN ('offer', 'answer', 'ice-candidate')),
  signal_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '1 minute')
);

-- Enable RLS with SECURE policies (SUPER CARD requirement)
ALTER TABLE webrtc_signals ENABLE ROW LEVEL SECURITY;

-- ONLY sender and target can see signals
CREATE POLICY "Signals visible only to sender and target" ON webrtc_signals 
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = target_id);

-- Only authenticated users can send signals to specific targets
CREATE POLICY "Authenticated users can send signals" ON webrtc_signals 
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id 
    AND target_id IS NOT NULL
  );

-- Enable realtime (filtered by RLS)
ALTER PUBLICATION supabase_realtime ADD TABLE webrtc_signals;

-- 4. Create live reactions table for real-time audience reactions
CREATE TABLE IF NOT EXISTS live_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES artist_live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('fire', 'heart', 'clap', 'wow', 'laugh')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE live_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can view reactions
CREATE POLICY "Anyone can view live reactions" ON live_reactions FOR SELECT USING (true);

-- Authenticated users can react
CREATE POLICY "Authenticated users can create reactions" ON live_reactions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE live_reactions;

-- 5. Add gift_tier to live_gifts for animation intensity (if not exists)
ALTER TABLE live_gifts
ADD COLUMN IF NOT EXISTS gift_tier text DEFAULT 'standard' 
  CHECK (gift_tier IN ('standard', 'premium', 'legendary'));