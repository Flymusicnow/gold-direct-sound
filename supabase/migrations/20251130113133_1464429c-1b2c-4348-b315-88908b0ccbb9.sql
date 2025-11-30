-- Create fan_achievements table
CREATE TABLE fan_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_user_id UUID NOT NULL,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meta JSONB DEFAULT '{}',
  UNIQUE(fan_user_id, achievement_key)
);

-- Enable RLS
ALTER TABLE fan_achievements ENABLE ROW LEVEL SECURITY;

-- Policies: Fans can view their own achievements
CREATE POLICY "Users can view own achievements" ON fan_achievements
  FOR SELECT USING (auth.uid() = fan_user_id);

-- System can insert achievements
CREATE POLICY "System can insert achievements" ON fan_achievements
  FOR INSERT WITH CHECK (auth.uid() = fan_user_id);

-- Index for performance
CREATE INDEX idx_fan_achievements_user ON fan_achievements(fan_user_id);

-- RPC function to check and unlock achievements
CREATE OR REPLACE FUNCTION check_and_unlock_fan_achievements(_fan_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  new_achievements JSONB := '[]'::JSONB;
  follow_count INT;
  vote_count INT;
  stack_count INT;
  comment_count INT;
  like_count INT;
  total_xp NUMERIC;
  highest_level TEXT;
BEGIN
  -- Gather stats
  SELECT COUNT(*) INTO follow_count FROM follows WHERE fan_id = _fan_user_id;
  SELECT COUNT(*) INTO vote_count FROM spotlight_votes WHERE fan_user_id = _fan_user_id;
  SELECT COUNT(*) INTO stack_count FROM playlists WHERE user_id = _fan_user_id;
  SELECT COUNT(*) INTO comment_count FROM comments WHERE user_id = _fan_user_id;
  SELECT COUNT(*) INTO like_count FROM likes WHERE user_id = _fan_user_id;
  SELECT COALESCE(SUM(score), 0) INTO total_xp FROM fan_support_scores WHERE fan_user_id = _fan_user_id;
  SELECT MAX(level) INTO highest_level FROM fan_support_scores WHERE fan_user_id = _fan_user_id;
  
  -- Check and unlock achievements
  -- 1. First Step (first follow)
  IF follow_count >= 1 AND NOT EXISTS(SELECT 1 FROM fan_achievements WHERE fan_user_id = _fan_user_id AND achievement_key = 'first_follow') THEN
    INSERT INTO fan_achievements(fan_user_id, achievement_key) VALUES(_fan_user_id, 'first_follow');
    new_achievements := new_achievements || '["first_follow"]'::JSONB;
  END IF;
  
  -- 2. Spotlight Voter (first vote)
  IF vote_count >= 1 AND NOT EXISTS(SELECT 1 FROM fan_achievements WHERE fan_user_id = _fan_user_id AND achievement_key = 'first_vote') THEN
    INSERT INTO fan_achievements(fan_user_id, achievement_key) VALUES(_fan_user_id, 'first_vote');
    new_achievements := new_achievements || '["first_vote"]'::JSONB;
  END IF;
  
  -- 3. Stack Creator (first stack)
  IF stack_count >= 1 AND NOT EXISTS(SELECT 1 FROM fan_achievements WHERE fan_user_id = _fan_user_id AND achievement_key = 'first_stack') THEN
    INSERT INTO fan_achievements(fan_user_id, achievement_key) VALUES(_fan_user_id, 'first_stack');
    new_achievements := new_achievements || '["first_stack"]'::JSONB;
  END IF;
  
  -- 4. Active Supporter (50 XP)
  IF total_xp >= 50 AND NOT EXISTS(SELECT 1 FROM fan_achievements WHERE fan_user_id = _fan_user_id AND achievement_key = 'active_supporter') THEN
    INSERT INTO fan_achievements(fan_user_id, achievement_key) VALUES(_fan_user_id, 'active_supporter');
    new_achievements := new_achievements || '["active_supporter"]'::JSONB;
  END IF;
  
  -- 5. True Believer (150 XP)
  IF total_xp >= 150 AND NOT EXISTS(SELECT 1 FROM fan_achievements WHERE fan_user_id = _fan_user_id AND achievement_key = 'true_believer') THEN
    INSERT INTO fan_achievements(fan_user_id, achievement_key) VALUES(_fan_user_id, 'true_believer');
    new_achievements := new_achievements || '["true_believer"]'::JSONB;
  END IF;
  
  -- 6. Comment Voice (5+ comments)
  IF comment_count >= 5 AND NOT EXISTS(SELECT 1 FROM fan_achievements WHERE fan_user_id = _fan_user_id AND achievement_key = 'comment_voice') THEN
    INSERT INTO fan_achievements(fan_user_id, achievement_key) VALUES(_fan_user_id, 'comment_voice');
    new_achievements := new_achievements || '["comment_voice"]'::JSONB;
  END IF;
  
  -- 7. Likes 10 (10+ likes)
  IF like_count >= 10 AND NOT EXISTS(SELECT 1 FROM fan_achievements WHERE fan_user_id = _fan_user_id AND achievement_key = 'likes_10') THEN
    INSERT INTO fan_achievements(fan_user_id, achievement_key) VALUES(_fan_user_id, 'likes_10');
    new_achievements := new_achievements || '["likes_10"]'::JSONB;
  END IF;
  
  -- 8. Bronze Supporter
  IF highest_level IN ('bronze', 'silver', 'gold') AND NOT EXISTS(SELECT 1 FROM fan_achievements WHERE fan_user_id = _fan_user_id AND achievement_key = 'bronze_supporter') THEN
    INSERT INTO fan_achievements(fan_user_id, achievement_key) VALUES(_fan_user_id, 'bronze_supporter');
    new_achievements := new_achievements || '["bronze_supporter"]'::JSONB;
  END IF;
  
  RETURN new_achievements;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;