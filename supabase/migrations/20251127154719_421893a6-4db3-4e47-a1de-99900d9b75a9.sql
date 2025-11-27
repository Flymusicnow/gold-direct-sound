-- Create artist_posts table for social updates
CREATE TABLE public.artist_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'followers')),
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on artist_posts
ALTER TABLE public.artist_posts ENABLE ROW LEVEL SECURITY;

-- Artists can manage own posts
CREATE POLICY "Artists can manage own posts" ON artist_posts
FOR ALL USING (EXISTS (
  SELECT 1 FROM artist_profiles WHERE id = artist_posts.artist_id AND user_id = auth.uid()
));

-- Anyone can view public posts
CREATE POLICY "Anyone can view public posts" ON artist_posts
FOR SELECT USING (visibility = 'public');

-- Create artist_events table for live events
CREATE TABLE public.artist_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'other' CHECK (event_type IN ('live_stream', 'concert', 'other')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location TEXT,
  ticket_url TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'past', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on artist_events
ALTER TABLE public.artist_events ENABLE ROW LEVEL SECURITY;

-- Artists can manage own events
CREATE POLICY "Artists can manage own events" ON artist_events
FOR ALL USING (EXISTS (
  SELECT 1 FROM artist_profiles WHERE id = artist_events.artist_id AND user_id = auth.uid()
));

-- Anyone can view events from approved artists
CREATE POLICY "Anyone can view events from approved artists" ON artist_events
FOR SELECT USING (EXISTS (
  SELECT 1 FROM artist_profiles WHERE id = artist_events.artist_id AND status = 'approved'
));

-- Create artist_activities table for fan-to-artist activity feed
CREATE TABLE public.artist_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_follower', 'track_liked', 'comment', 'event_created')),
  actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on artist_activities
ALTER TABLE public.artist_activities ENABLE ROW LEVEL SECURITY;

-- Artists can view their own activities
CREATE POLICY "Artists can view own activities" ON artist_activities
FOR SELECT USING (EXISTS (
  SELECT 1 FROM artist_profiles WHERE id = artist_activities.artist_id AND user_id = auth.uid()
));

-- Authenticated users can create activities
CREATE POLICY "Authenticated users can create activities" ON artist_activities
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Add trigger for updated_at on artist_posts
CREATE TRIGGER update_artist_posts_updated_at
BEFORE UPDATE ON public.artist_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on artist_events
CREATE TRIGGER update_artist_events_updated_at
BEFORE UPDATE ON public.artist_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();