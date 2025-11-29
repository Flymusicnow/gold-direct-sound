-- Create track_collaborators table
CREATE TABLE public.track_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  collaborator_artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'featured' CHECK (role IN ('featured', 'producer', 'writer', 'mixer')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.track_collaborators ENABLE ROW LEVEL SECURITY;

-- Owner artist and collaborator can view
CREATE POLICY "Artists can view own track collaborations"
  ON public.track_collaborators
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tracks t
      JOIN artist_profiles ap ON t.artist_id = ap.id
      WHERE t.id = track_collaborators.track_id
      AND ap.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM artist_profiles ap
      WHERE ap.id = track_collaborators.collaborator_artist_id
      AND ap.user_id = auth.uid()
    )
  );

-- Public can view accepted collaborations
CREATE POLICY "Public can view accepted collaborations"
  ON public.track_collaborators
  FOR SELECT
  USING (status = 'accepted');

-- Track owner can insert collaborators
CREATE POLICY "Track owners can add collaborators"
  ON public.track_collaborators
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tracks t
      JOIN artist_profiles ap ON t.artist_id = ap.id
      WHERE t.id = track_collaborators.track_id
      AND ap.user_id = auth.uid()
    )
  );

-- Collaborator can update their response
CREATE POLICY "Collaborators can respond to invites"
  ON public.track_collaborators
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM artist_profiles ap
      WHERE ap.id = track_collaborators.collaborator_artist_id
      AND ap.user_id = auth.uid()
    )
  );

-- Track owner can delete pending invites
CREATE POLICY "Track owners can delete pending invites"
  ON public.track_collaborators
  FOR DELETE
  USING (
    status = 'pending' AND
    EXISTS (
      SELECT 1 FROM tracks t
      JOIN artist_profiles ap ON t.artist_id = ap.id
      WHERE t.id = track_collaborators.track_id
      AND ap.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_track_collaborators_track_id ON public.track_collaborators(track_id);
CREATE INDEX idx_track_collaborators_collaborator_id ON public.track_collaborators(collaborator_artist_id);
CREATE INDEX idx_track_collaborators_status ON public.track_collaborators(status);

-- Create notification trigger for collaboration invites
CREATE OR REPLACE FUNCTION public.notify_collaboration_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  track_title TEXT;
  owner_artist_name TEXT;
  collaborator_user_id UUID;
BEGIN
  -- Get track title and owner artist name
  SELECT t.title, ap.artist_name INTO track_title, owner_artist_name
  FROM tracks t
  JOIN artist_profiles ap ON t.artist_id = ap.id
  WHERE t.id = NEW.track_id;
  
  -- Get collaborator user_id
  SELECT user_id INTO collaborator_user_id
  FROM artist_profiles
  WHERE id = NEW.collaborator_artist_id;
  
  -- Create notification for collaborator
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (
    collaborator_user_id,
    'collaboration_invite',
    'Collaboration Request',
    owner_artist_name || ' invited you to collaborate on "' || track_title || '"',
    '/studio/tracks',
    jsonb_build_object(
      'track_id', NEW.track_id,
      'collaboration_id', NEW.id,
      'artist_name', owner_artist_name
    )
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER track_collaborators_notify_invite
  AFTER INSERT ON public.track_collaborators
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_collaboration_invite();