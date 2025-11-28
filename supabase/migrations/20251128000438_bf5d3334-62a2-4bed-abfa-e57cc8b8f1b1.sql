-- Allow everyone to view all fan spotlight stats for leaderboard
CREATE POLICY "Anyone can view fan spotlight stats for leaderboard"
ON fan_spotlight_stats
FOR SELECT
USING (true);