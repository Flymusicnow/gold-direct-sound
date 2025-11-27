-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Create trigger function to notify artist on vote
CREATE OR REPLACE FUNCTION notify_artist_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  artist_user_id UUID;
  entry_title TEXT;
  artist_name TEXT;
BEGIN
  -- Get artist user_id, entry title, and artist name
  SELECT ap.user_id, COALESCE(se.title, t.title), ap.artist_name
  INTO artist_user_id, entry_title, artist_name
  FROM spotlight_entries se
  JOIN artist_profiles ap ON se.artist_id = ap.id
  JOIN tracks t ON se.track_id = t.id
  WHERE se.id = NEW.entry_id;
  
  -- Create notification for the artist
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (
    artist_user_id,
    'spotlight_vote',
    'New Spotlight Vote!',
    'Your track "' || entry_title || '" received a new vote',
    '/studio/spotlight',
    jsonb_build_object('entry_id', NEW.entry_id, 'artist_name', artist_name)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on spotlight_votes
CREATE TRIGGER on_spotlight_vote_notify_artist
  AFTER INSERT ON spotlight_votes
  FOR EACH ROW
  EXECUTE FUNCTION notify_artist_on_vote();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);