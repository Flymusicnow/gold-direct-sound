-- Add rank_at_vote column to track the rank when a fan cast their vote
ALTER TABLE spotlight_votes ADD COLUMN IF NOT EXISTS rank_at_vote integer;