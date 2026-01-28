-- Drop existing policy and recreate with explicit WITH CHECK for INSERT
DROP POLICY IF EXISTS "Artists can manage own goals" ON public.artist_goals;

CREATE POLICY "Artists can manage own goals" 
ON public.artist_goals
FOR ALL
TO authenticated
USING (
  artist_id IN (
    SELECT id FROM artist_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  artist_id IN (
    SELECT id FROM artist_profiles WHERE user_id = auth.uid()
  )
);