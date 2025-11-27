-- Create trigger to notify artists when fans vote for their Spotlight entries
CREATE TRIGGER on_spotlight_vote_notify
  AFTER INSERT ON spotlight_votes
  FOR EACH ROW EXECUTE FUNCTION notify_artist_on_vote();

-- Create function to log spotlight votes as artist activities
CREATE OR REPLACE FUNCTION log_spotlight_vote_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  entry_artist_id UUID;
BEGIN
  -- Get the artist_id from the spotlight entry
  SELECT artist_id INTO entry_artist_id
  FROM spotlight_entries WHERE id = NEW.entry_id;
  
  -- Insert activity record for the artist
  INSERT INTO artist_activities (artist_id, type, actor_user_id, created_at)
  VALUES (entry_artist_id, 'spotlight_vote', NEW.fan_user_id, NOW());
  
  RETURN NEW;
END;
$$;

-- Create trigger to log spotlight votes as activities
CREATE TRIGGER on_spotlight_vote_log_activity
  AFTER INSERT ON spotlight_votes
  FOR EACH ROW EXECUTE FUNCTION log_spotlight_vote_activity();

-- Create function to notify fans when followed artists join Spotlight
CREATE OR REPLACE FUNCTION notify_fans_on_spotlight_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  artist_name_var TEXT;
  fan_record RECORD;
BEGIN
  -- Only trigger when entry is newly approved
  IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
    -- Get artist name
    SELECT artist_name INTO artist_name_var
    FROM artist_profiles WHERE id = NEW.artist_id;
    
    -- Notify all fans following this artist
    FOR fan_record IN 
      SELECT fan_id FROM follows WHERE artist_id = NEW.artist_id
    LOOP
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (
        fan_record.fan_id,
        'spotlight_entry',
        '🌟 Artist in Spotlight!',
        artist_name_var || ' just entered FlyMusic Spotlight. Vote for them!',
        '/spotlight/' || NEW.campaign_id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to notify fans when artists join Spotlight
CREATE TRIGGER on_spotlight_entry_approved
  AFTER INSERT OR UPDATE OF status ON spotlight_entries
  FOR EACH ROW EXECUTE FUNCTION notify_fans_on_spotlight_entry();

-- Enable real-time updates for spotlight votes
ALTER PUBLICATION supabase_realtime ADD TABLE public.spotlight_votes;

-- Enable real-time updates for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;