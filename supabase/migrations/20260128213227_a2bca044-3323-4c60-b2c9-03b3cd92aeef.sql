-- Artist Goals table
CREATE TABLE public.artist_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_amount INTEGER NOT NULL CHECK (target_amount > 0),
  current_amount INTEGER DEFAULT 0,
  supporter_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Only one active goal per artist at a time
CREATE UNIQUE INDEX artist_active_goal_idx ON public.artist_goals (artist_id) WHERE status = 'active';

-- Enable RLS
ALTER TABLE public.artist_goals ENABLE ROW LEVEL SECURITY;

-- Artists can manage their own goals
CREATE POLICY "Artists can manage own goals"
  ON public.artist_goals FOR ALL
  USING (
    artist_id IN (
      SELECT id FROM public.artist_profiles WHERE user_id = auth.uid()
    )
  );

-- Everyone can view active goals (for public artist pages)
CREATE POLICY "Public can view active goals"
  ON public.artist_goals FOR SELECT
  USING (status = 'active');

-- Goal Donations table
CREATE TABLE public.goal_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.artist_goals(id) ON DELETE CASCADE,
  fan_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.goal_donations ENABLE ROW LEVEL SECURITY;

-- Fans can view their own donations
CREATE POLICY "Fans can view own donations"
  ON public.goal_donations FOR SELECT
  USING (auth.uid() = fan_user_id);

-- Fans can create donations
CREATE POLICY "Fans can create donations"
  ON public.goal_donations FOR INSERT
  WITH CHECK (auth.uid() = fan_user_id);

-- Trigger for updated_at
CREATE TRIGGER set_artist_goals_updated_at
  BEFORE UPDATE ON public.artist_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();