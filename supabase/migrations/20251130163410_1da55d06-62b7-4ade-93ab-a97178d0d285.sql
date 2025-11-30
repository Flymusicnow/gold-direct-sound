-- Create fan onboarding progress table
CREATE TABLE IF NOT EXISTS public.fan_onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  has_visited_discover boolean DEFAULT false,
  has_followed_artist boolean DEFAULT false,
  has_voted_spotlight boolean DEFAULT false,
  has_created_stack boolean DEFAULT false,
  has_viewed_supporter boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  onboarding_skipped boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fan_onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view own onboarding progress
CREATE POLICY "Users can view own onboarding progress"
  ON public.fan_onboarding_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert own onboarding progress
CREATE POLICY "Users can insert own onboarding progress"
  ON public.fan_onboarding_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update own onboarding progress
CREATE POLICY "Users can update own onboarding progress"
  ON public.fan_onboarding_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create update trigger for updated_at
CREATE TRIGGER update_fan_onboarding_progress_updated_at
  BEFORE UPDATE ON public.fan_onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();