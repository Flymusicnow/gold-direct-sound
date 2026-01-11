-- Create function to notify followers when artist goes live
CREATE OR REPLACE FUNCTION notify_followers_on_live()
RETURNS TRIGGER AS $$
DECLARE
  follower_record RECORD;
  v_artist_name TEXT;
BEGIN
  -- Only trigger when status changes to 'live'
  IF NEW.status = 'live' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'live') THEN
    -- Get artist name
    SELECT artist_name INTO v_artist_name 
    FROM artist_profiles 
    WHERE id = NEW.artist_id;
    
    -- Insert notifications for all followers
    FOR follower_record IN 
      SELECT fan_id FROM follows WHERE artist_id = NEW.artist_id
    LOOP
      INSERT INTO notifications (user_id, type, title, message, link, read)
      VALUES (
        follower_record.fan_id,
        'artist_going_live',
        COALESCE(v_artist_name, 'An artist you follow') || ' is now live!',
        'Watch their live stream now',
        '/live/' || NEW.artist_id,
        false
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_artist_goes_live ON artist_live_streams;
CREATE TRIGGER on_artist_goes_live
  AFTER INSERT OR UPDATE ON artist_live_streams
  FOR EACH ROW
  EXECUTE FUNCTION notify_followers_on_live();