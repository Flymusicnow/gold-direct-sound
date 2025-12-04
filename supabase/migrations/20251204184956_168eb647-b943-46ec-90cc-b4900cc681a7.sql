
-- =====================================================
-- PHASE 2: SOCIAL RITUAL SYSTEM
-- =====================================================

-- Missions table (daily/weekly missions)
CREATE TABLE public.missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_key TEXT NOT NULL UNIQUE,
  mission_type TEXT NOT NULL DEFAULT 'daily' CHECK (mission_type IN ('daily', 'weekly', 'special')),
  title TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER NOT NULL DEFAULT 5,
  icon TEXT DEFAULT 'star',
  target_count INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mission completions tracking
CREATE TABLE public.mission_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_id, period_start)
);

-- Artist shoutouts
CREATE TABLE public.artist_shoutouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  message TEXT,
  shoutout_type TEXT NOT NULL DEFAULT 'weekly_top' CHECK (shoutout_type IN ('weekly_top', 'milestone', 'custom')),
  supporter_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Fan monthly wraps (FlyWrapped)
CREATE TABLE public.fan_monthly_wraps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  top_artists JSONB DEFAULT '[]',
  top_tracks JSONB DEFAULT '[]',
  total_xp_earned INTEGER DEFAULT 0,
  artists_discovered INTEGER DEFAULT 0,
  spotlight_votes_cast INTEGER DEFAULT 0,
  total_plays INTEGER DEFAULT 0,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month, year)
);

-- =====================================================
-- PHASE 3: REACH ECONOMY 2.0
-- =====================================================

-- Boost tokens (fans get 3 per week)
CREATE TABLE public.boost_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tokens_available INTEGER NOT NULL DEFAULT 3,
  tokens_used_this_week INTEGER NOT NULL DEFAULT 0,
  week_start DATE NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::DATE,
  last_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Boost usage history
CREATE TABLE public.boost_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  boost_type TEXT NOT NULL DEFAULT 'discover' CHECK (boost_type IN ('discover', 'trending', 'spotlight', 'feed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crowd pushes (collective fan action)
CREATE TABLE public.crowd_pushes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  target_supporters INTEGER NOT NULL DEFAULT 100,
  current_supporters INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crowd push participants
CREATE TABLE public.crowd_push_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crowd_push_id UUID NOT NULL REFERENCES public.crowd_pushes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(crowd_push_id, user_id)
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Missions (public read)
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active missions" ON public.missions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage missions" ON public.missions FOR ALL USING (is_admin());

-- Mission completions
ALTER TABLE public.mission_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own completions" ON public.mission_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own completions" ON public.mission_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own completions" ON public.mission_completions FOR UPDATE USING (auth.uid() = user_id);

-- Artist shoutouts
ALTER TABLE public.artist_shoutouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view shoutouts" ON public.artist_shoutouts FOR SELECT USING (true);
CREATE POLICY "Artists can create own shoutouts" ON public.artist_shoutouts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM artist_profiles WHERE id = artist_id AND user_id = auth.uid())
);

-- Fan monthly wraps
ALTER TABLE public.fan_monthly_wraps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wraps" ON public.fan_monthly_wraps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert wraps" ON public.fan_monthly_wraps FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Boost tokens
ALTER TABLE public.boost_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tokens" ON public.boost_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tokens" ON public.boost_tokens FOR ALL USING (auth.uid() = user_id);

-- Boost usage
ALTER TABLE public.boost_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own boosts" ON public.boost_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create boosts" ON public.boost_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Crowd pushes
ALTER TABLE public.crowd_pushes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view crowd pushes" ON public.crowd_pushes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create pushes" ON public.crowd_pushes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "System can update pushes" ON public.crowd_pushes FOR UPDATE USING (true);

-- Crowd push participants
ALTER TABLE public.crowd_push_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view participants" ON public.crowd_push_participants FOR SELECT USING (true);
CREATE POLICY "Users can join pushes" ON public.crowd_push_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- SEED DATA: Initial Missions
-- =====================================================

INSERT INTO public.missions (mission_key, mission_type, title, description, xp_reward, icon, target_count) VALUES
('daily_listen_new', 'daily', 'Discover New Sound', 'Listen to a track from an artist you don''t follow', 5, 'headphones', 1),
('daily_like_tracks', 'daily', 'Show Love', 'Like 3 tracks today', 3, 'heart', 3),
('daily_watch_video', 'daily', 'Video Vibes', 'Watch a Rising Artist video', 4, 'play', 1),
('daily_spotlight_vote', 'daily', 'Spotlight Supporter', 'Vote for an artist in Spotlight', 5, 'star', 1),
('weekly_support_artist', 'weekly', 'True Supporter', 'Reach Bronze level with any artist', 15, 'award', 1),
('weekly_discover_genre', 'weekly', 'Genre Explorer', 'Listen to 5 tracks from a new genre', 10, 'compass', 5),
('weekly_share_track', 'weekly', 'Music Ambassador', 'Share 3 tracks with friends', 12, 'share', 3),
('weekly_full_video', 'weekly', 'Dedicated Viewer', 'Watch 5 videos to completion', 10, 'video', 5);
