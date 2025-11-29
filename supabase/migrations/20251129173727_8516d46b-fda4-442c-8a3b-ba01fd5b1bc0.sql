-- Create fan_support_scores table
CREATE TABLE public.fan_support_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL DEFAULT 0,
  level TEXT NOT NULL DEFAULT 'none' CHECK (level IN ('none', 'bronze', 'silver', 'gold')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  -- Future-proof fields for payments
  paid_support_count INTEGER DEFAULT 0,
  paid_support_value NUMERIC DEFAULT 0,
  UNIQUE(fan_user_id, artist_id)
);

-- Enable RLS
ALTER TABLE public.fan_support_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own support scores"
  ON public.fan_support_scores FOR SELECT
  USING (fan_user_id = auth.uid());

CREATE POLICY "Anyone can view support scores for leaderboards"
  ON public.fan_support_scores FOR SELECT
  USING (true);

CREATE POLICY "System can insert support scores"
  ON public.fan_support_scores FOR INSERT
  WITH CHECK (fan_user_id = auth.uid());

CREATE POLICY "System can update support scores"
  ON public.fan_support_scores FOR UPDATE
  USING (fan_user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_fan_support_scores_artist ON public.fan_support_scores(artist_id);
CREATE INDEX idx_fan_support_scores_fan ON public.fan_support_scores(fan_user_id);
CREATE INDEX idx_fan_support_scores_level ON public.fan_support_scores(artist_id, level, score DESC);