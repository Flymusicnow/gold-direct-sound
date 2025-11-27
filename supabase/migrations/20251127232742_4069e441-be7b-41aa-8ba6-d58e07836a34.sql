-- Create fan_spotlight_stats table for voting rewards
CREATE TABLE fan_spotlight_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_votes INTEGER DEFAULT 0,
  current_tier TEXT DEFAULT 'none',
  last_voted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE fan_spotlight_stats ENABLE ROW LEVEL SECURITY;

-- Users can view own stats
CREATE POLICY "Users can view own stats" ON fan_spotlight_stats
  FOR SELECT USING (auth.uid() = user_id);

-- System can manage stats (via trigger)
CREATE POLICY "System can insert stats" ON fan_spotlight_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update stats" ON fan_spotlight_stats
  FOR UPDATE USING (true);

-- Add cached_rank column to spotlight_entries for rank change tracking
ALTER TABLE spotlight_entries ADD COLUMN IF NOT EXISTS cached_rank INTEGER DEFAULT NULL;

-- Create trigger function to increment fan spotlight votes
CREATE OR REPLACE FUNCTION increment_fan_spotlight_votes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO fan_spotlight_stats (user_id, total_votes, last_voted_at)
  VALUES (NEW.fan_user_id, 1, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_votes = fan_spotlight_stats.total_votes + 1,
    last_voted_at = NOW(),
    current_tier = CASE
      WHEN fan_spotlight_stats.total_votes + 1 >= 50 THEN 'gold'
      WHEN fan_spotlight_stats.total_votes + 1 >= 25 THEN 'silver'
      WHEN fan_spotlight_stats.total_votes + 1 >= 10 THEN 'bronze'
      ELSE 'none'
    END,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger on spotlight_votes
CREATE TRIGGER on_spotlight_vote_increment_fan_stats
  AFTER INSERT ON spotlight_votes
  FOR EACH ROW EXECUTE FUNCTION increment_fan_spotlight_votes();

-- Enable realtime for fan_spotlight_stats
ALTER PUBLICATION supabase_realtime ADD TABLE fan_spotlight_stats;