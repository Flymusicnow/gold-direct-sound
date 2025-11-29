-- =============================================
-- PHASE 3: LIVE 2.0 (Enhanced Streaming)
-- =============================================

-- Live gifts table
CREATE TABLE live_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES artist_live_streams(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gift_type TEXT NOT NULL CHECK (gift_type IN ('heart', 'gold_sparkle', 'fire', 'star')),
  xp_value INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE live_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live gifts"
  ON live_gifts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can send gifts"
  ON live_gifts FOR INSERT
  WITH CHECK (auth.uid() = sender_user_id);

-- Live spotlight votes
CREATE TABLE live_spotlight_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES artist_live_streams(id) ON DELETE CASCADE,
  voter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES spotlight_entries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE live_spotlight_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live spotlight votes"
  ON live_spotlight_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON live_spotlight_votes FOR INSERT
  WITH CHECK (auth.uid() = voter_user_id);

-- Stream tickets table
CREATE TABLE stream_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES artist_live_streams(id) ON DELETE CASCADE,
  fan_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  price_paid NUMERIC NOT NULL,
  stripe_payment_id TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stream_id, fan_user_id)
);

ALTER TABLE stream_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
  ON stream_tickets FOR SELECT
  USING (auth.uid() = fan_user_id);

CREATE POLICY "Artists can view tickets for their streams"
  ON stream_tickets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM artist_live_streams als
    JOIN artist_profiles ap ON als.artist_id = ap.id
    WHERE als.id = stream_tickets.stream_id AND ap.user_id = auth.uid()
  ));

-- Live clips table
CREATE TABLE live_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES artist_live_streams(id) ON DELETE CASCADE,
  creator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  title TEXT,
  start_time_seconds INTEGER,
  duration_seconds INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE live_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live clips"
  ON live_clips FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create clips"
  ON live_clips FOR INSERT
  WITH CHECK (auth.uid() = creator_user_id);

-- Add ticketing fields to artist_live_streams
ALTER TABLE artist_live_streams ADD COLUMN IF NOT EXISTS is_ticketed BOOLEAN DEFAULT FALSE;
ALTER TABLE artist_live_streams ADD COLUMN IF NOT EXISTS ticket_price NUMERIC;

-- Enable realtime for live features
ALTER PUBLICATION supabase_realtime ADD TABLE live_gifts;
ALTER PUBLICATION supabase_realtime ADD TABLE live_spotlight_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE live_clips;