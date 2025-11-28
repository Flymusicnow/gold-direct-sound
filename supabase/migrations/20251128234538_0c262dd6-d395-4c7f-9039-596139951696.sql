-- Create artist referral codes table
CREATE TABLE public.artist_referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  max_uses INTEGER NOT NULL DEFAULT 10,
  current_uses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create artist referral uses tracking table
CREATE TABLE public.artist_referral_uses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code_id UUID NOT NULL REFERENCES public.artist_referral_codes(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referral_code_id, referred_user_id)
);

-- Create artist achievements table
CREATE TABLE public.artist_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, achievement_type)
);

-- Add referral bonus tier to artist_beta_access
ALTER TABLE public.artist_beta_access
ADD COLUMN referral_bonus_tier TEXT DEFAULT NULL;

-- Enable RLS
ALTER TABLE public.artist_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_referral_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artist_referral_codes
CREATE POLICY "Users can view own referral codes"
ON public.artist_referral_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own referral codes"
ON public.artist_referral_codes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view active codes for validation"
ON public.artist_referral_codes FOR SELECT
USING (is_active = true);

-- RLS Policies for artist_referral_uses
CREATE POLICY "Users can view own referral uses"
ON public.artist_referral_uses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.artist_referral_codes
    WHERE artist_referral_codes.id = artist_referral_uses.referral_code_id
    AND artist_referral_codes.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert referral uses"
ON public.artist_referral_uses FOR INSERT
WITH CHECK (true);

-- RLS Policies for artist_achievements
CREATE POLICY "Users can view own achievements"
ON public.artist_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view other artists' achievements for public display"
ON public.artist_achievements FOR SELECT
USING (true);

CREATE POLICY "System can insert achievements"
ON public.artist_achievements FOR INSERT
WITH CHECK (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_artist_referral_code(_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- Check if user already has an active code
  SELECT EXISTS (
    SELECT 1 FROM artist_referral_codes
    WHERE user_id = _user_id AND is_active = true
  ) INTO code_exists;
  
  IF code_exists THEN
    RETURN (SELECT code FROM artist_referral_codes WHERE user_id = _user_id AND is_active = true LIMIT 1);
  END IF;
  
  -- Generate unique code
  LOOP
    new_code := 'FLY' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || _user_id::TEXT) FROM 1 FOR 8));
    
    SELECT EXISTS (
      SELECT 1 FROM artist_referral_codes WHERE code = new_code
    ) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  -- Insert new code
  INSERT INTO artist_referral_codes (user_id, code)
  VALUES (_user_id, new_code);
  
  RETURN new_code;
END;
$$;

-- Function to redeem referral code
CREATE OR REPLACE FUNCTION public.redeem_referral_code(_code TEXT, _user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_record RECORD;
  referrer_use_count INTEGER;
BEGIN
  -- Check if user already redeemed any code
  IF EXISTS (SELECT 1 FROM artist_referral_uses WHERE referred_user_id = _user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already used a referral code');
  END IF;
  
  -- Find and validate the code
  SELECT * INTO code_record
  FROM artist_referral_codes
  WHERE code = _code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND current_uses < max_uses;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired referral code');
  END IF;
  
  -- Insert referral use
  INSERT INTO artist_referral_uses (referral_code_id, referred_user_id)
  VALUES (code_record.id, _user_id);
  
  -- Increment code usage
  UPDATE artist_referral_codes
  SET current_uses = current_uses + 1
  WHERE id = code_record.id;
  
  -- Check referrer's total referrals and update bonus tier
  SELECT COUNT(*) INTO referrer_use_count
  FROM artist_referral_uses
  WHERE referral_code_id IN (
    SELECT id FROM artist_referral_codes WHERE user_id = code_record.user_id
  );
  
  -- Update referrer's bonus tier
  UPDATE artist_beta_access
  SET referral_bonus_tier = CASE
    WHEN referrer_use_count >= 10 THEN 'ambassador'
    WHEN referrer_use_count >= 5 THEN 'talent_scout'
    WHEN referrer_use_count >= 1 THEN 'community_builder'
    ELSE NULL
  END
  WHERE user_id = code_record.user_id;
  
  RETURN jsonb_build_object('success', true, 'referrer', code_record.user_id);
END;
$$;