-- Create function to increment play count atomically
CREATE OR REPLACE FUNCTION public.increment_play_count(track_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE tracks
  SET play_count = COALESCE(play_count, 0) + 1
  WHERE id = track_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_play_count(uuid) TO authenticated;