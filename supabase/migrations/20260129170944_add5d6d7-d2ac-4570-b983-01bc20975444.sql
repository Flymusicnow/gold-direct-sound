-- Create donate_to_goal function with SECURITY DEFINER
-- This allows fans to donate and update artist_goals atomically

CREATE OR REPLACE FUNCTION public.donate_to_goal(
  p_goal_id UUID,
  p_amount INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_goal RECORD;
  v_is_first_donation BOOLEAN;
BEGIN
  -- Validate authentication
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Get the goal
  SELECT * INTO v_goal FROM artist_goals WHERE id = p_goal_id AND status = 'active';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Goal not found or not active');
  END IF;

  -- Check if this is the fan's first donation to this goal
  SELECT NOT EXISTS(
    SELECT 1 FROM goal_donations 
    WHERE goal_id = p_goal_id AND fan_user_id = v_user_id
  ) INTO v_is_first_donation;

  -- Insert the donation
  INSERT INTO goal_donations (goal_id, fan_user_id, amount)
  VALUES (p_goal_id, v_user_id, p_amount);

  -- Update goal with new amounts
  UPDATE artist_goals SET
    current_amount = COALESCE(current_amount, 0) + p_amount,
    supporter_count = CASE WHEN v_is_first_donation THEN COALESCE(supporter_count, 0) + 1 ELSE supporter_count END,
    status = CASE WHEN COALESCE(current_amount, 0) + p_amount >= target_amount THEN 'completed' ELSE status END,
    completed_at = CASE WHEN COALESCE(current_amount, 0) + p_amount >= target_amount THEN now() ELSE completed_at END,
    updated_at = now()
  WHERE id = p_goal_id;

  RETURN jsonb_build_object('success', true);
END;
$$;