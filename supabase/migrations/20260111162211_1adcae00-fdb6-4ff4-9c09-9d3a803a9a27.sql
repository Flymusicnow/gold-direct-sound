-- Add paused state to stream status
ALTER TABLE artist_live_streams
ADD COLUMN IF NOT EXISTS is_paused boolean DEFAULT false;

-- Add fan invite tracking
CREATE TABLE IF NOT EXISTS live_fan_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES artist_live_streams(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL,
  invited_user_id uuid NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  invited_at timestamptz DEFAULT now(),
  responded_at timestamptz
);

-- Create index for faster lookups
CREATE INDEX idx_live_fan_invites_stream ON live_fan_invites(stream_id);
CREATE INDEX idx_live_fan_invites_user ON live_fan_invites(invited_user_id);

-- RLS policies
ALTER TABLE live_fan_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists can manage their invites" ON live_fan_invites 
  FOR ALL USING (artist_id IN (
    SELECT id FROM artist_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Invited users can view their invites" ON live_fan_invites 
  FOR SELECT USING (invited_user_id = auth.uid());

CREATE POLICY "Invited users can update their invite status" ON live_fan_invites 
  FOR UPDATE USING (invited_user_id = auth.uid())
  WITH CHECK (invited_user_id = auth.uid() AND status IN ('accepted', 'declined'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE live_fan_invites;