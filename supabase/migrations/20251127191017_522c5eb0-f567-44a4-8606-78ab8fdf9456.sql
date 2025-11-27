-- Create spotlight_campaigns table
CREATE TABLE public.spotlight_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  banner_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create spotlight_entries table
CREATE TABLE public.spotlight_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES spotlight_campaigns(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  total_votes INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, track_id)
);

-- Create spotlight_votes table
CREATE TABLE public.spotlight_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES spotlight_campaigns(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES spotlight_entries(id) ON DELETE CASCADE,
  fan_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entry_id, fan_user_id)
);

-- Enable Row Level Security
ALTER TABLE public.spotlight_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spotlight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spotlight_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for spotlight_campaigns
CREATE POLICY "Anyone can view active or ended campaigns"
ON public.spotlight_campaigns
FOR SELECT
USING (status IN ('active', 'ended') OR is_admin());

CREATE POLICY "Admins can manage campaigns"
ON public.spotlight_campaigns
FOR ALL
USING (is_admin());

-- RLS Policies for spotlight_entries
CREATE POLICY "Anyone can view approved entries"
ON public.spotlight_entries
FOR SELECT
USING (
  status = 'approved' 
  OR EXISTS (
    SELECT 1 FROM artist_profiles 
    WHERE artist_profiles.id = spotlight_entries.artist_id 
    AND artist_profiles.user_id = auth.uid()
  )
  OR is_admin()
);

CREATE POLICY "Artists can insert own entries"
ON public.spotlight_entries
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM artist_profiles 
    WHERE artist_profiles.id = artist_id 
    AND artist_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Artists can update own pending entries"
ON public.spotlight_entries
FOR UPDATE
USING (
  (status = 'pending' AND EXISTS (
    SELECT 1 FROM artist_profiles 
    WHERE artist_profiles.id = spotlight_entries.artist_id 
    AND artist_profiles.user_id = auth.uid()
  ))
  OR is_admin()
);

CREATE POLICY "Artists can delete own pending entries"
ON public.spotlight_entries
FOR DELETE
USING (
  (status = 'pending' AND EXISTS (
    SELECT 1 FROM artist_profiles 
    WHERE artist_profiles.id = spotlight_entries.artist_id 
    AND artist_profiles.user_id = auth.uid()
  ))
  OR is_admin()
);

-- RLS Policies for spotlight_votes
CREATE POLICY "Users can view own votes"
ON public.spotlight_votes
FOR SELECT
USING (fan_user_id = auth.uid() OR is_admin());

CREATE POLICY "Authenticated users can vote"
ON public.spotlight_votes
FOR INSERT
WITH CHECK (fan_user_id = auth.uid());

CREATE POLICY "Users can delete own votes"
ON public.spotlight_votes
FOR DELETE
USING (fan_user_id = auth.uid());

-- Create trigger functions for vote counting
CREATE OR REPLACE FUNCTION public.increment_spotlight_votes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE spotlight_entries 
  SET total_votes = total_votes + 1 
  WHERE id = NEW.entry_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_spotlight_votes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE spotlight_entries 
  SET total_votes = total_votes - 1 
  WHERE id = OLD.entry_id;
  RETURN OLD;
END;
$$;

-- Create triggers
CREATE TRIGGER on_spotlight_vote_insert
AFTER INSERT ON spotlight_votes
FOR EACH ROW EXECUTE FUNCTION increment_spotlight_votes();

CREATE TRIGGER on_spotlight_vote_delete
AFTER DELETE ON spotlight_votes
FOR EACH ROW EXECUTE FUNCTION decrement_spotlight_votes();

-- Create trigger for updated_at
CREATE TRIGGER update_spotlight_campaigns_updated_at
BEFORE UPDATE ON spotlight_campaigns
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spotlight_entries_updated_at
BEFORE UPDATE ON spotlight_entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();