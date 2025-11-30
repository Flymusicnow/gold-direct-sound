-- Create function to increment video view count (bypasses RLS with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.increment_video_view_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE artist_video_posts
  SET view_count = view_count + 1
  WHERE id = NEW.video_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on video_views insert
CREATE TRIGGER on_video_view_insert
AFTER INSERT ON video_views
FOR EACH ROW
EXECUTE FUNCTION increment_video_view_count();

-- Sync existing view counts
UPDATE artist_video_posts avp
SET view_count = (
  SELECT COUNT(*) FROM video_views vv 
  WHERE vv.video_id = avp.id
);

-- Enable realtime for artist_video_posts so artists see live view updates
ALTER TABLE artist_video_posts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE artist_video_posts;