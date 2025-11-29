-- Create artist_merch_products table
CREATE TABLE public.artist_merch_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  image_url TEXT,
  external_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on artist_merch_products
ALTER TABLE public.artist_merch_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artist_merch_products
CREATE POLICY "Artists can manage own merch products"
ON public.artist_merch_products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM artist_profiles
    WHERE artist_profiles.id = artist_merch_products.artist_id
    AND artist_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view active merch from approved artists"
ON public.artist_merch_products
FOR SELECT
USING (
  status = 'active'
  AND EXISTS (
    SELECT 1 FROM artist_profiles
    WHERE artist_profiles.id = artist_merch_products.artist_id
    AND artist_profiles.status = 'approved'
  )
);

-- Create artist_live_streams table
CREATE TABLE public.artist_live_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  stream_type TEXT NOT NULL DEFAULT 'external',
  stream_url TEXT,
  thumbnail_url TEXT,
  scheduled_start TIMESTAMP WITH TIME ZONE,
  actual_start TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  viewer_count INTEGER DEFAULT 0,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on artist_live_streams
ALTER TABLE public.artist_live_streams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artist_live_streams
CREATE POLICY "Artists can manage own streams"
ON public.artist_live_streams
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM artist_profiles
    WHERE artist_profiles.id = artist_live_streams.artist_id
    AND artist_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view streams from approved artists"
ON public.artist_live_streams
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM artist_profiles
    WHERE artist_profiles.id = artist_live_streams.artist_id
    AND artist_profiles.status = 'approved'
  )
);

-- Create live_stream_chat table
CREATE TABLE public.live_stream_chat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.artist_live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_artist BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on live_stream_chat
ALTER TABLE public.live_stream_chat ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_stream_chat
CREATE POLICY "Anyone can view chat messages"
ON public.live_stream_chat
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can send chat messages"
ON public.live_stream_chat
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
ON public.live_stream_chat
FOR DELETE
USING (auth.uid() = user_id);

-- Enable Realtime for live streaming tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.artist_live_streams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_stream_chat;

-- Create trigger to update updated_at columns
CREATE TRIGGER update_artist_merch_products_updated_at
BEFORE UPDATE ON public.artist_merch_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_artist_live_streams_updated_at
BEFORE UPDATE ON public.artist_live_streams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to notify fans when artist goes live
CREATE OR REPLACE FUNCTION public.notify_fans_on_go_live()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  artist_name_var TEXT;
  fan_record RECORD;
BEGIN
  -- Only trigger when stream status changes to 'live'
  IF NEW.status = 'live' AND (OLD IS NULL OR OLD.status != 'live') THEN
    -- Get artist name
    SELECT artist_name INTO artist_name_var
    FROM artist_profiles WHERE id = NEW.artist_id;
    
    -- Notify all fans following this artist
    FOR fan_record IN 
      SELECT fan_id FROM follows WHERE artist_id = NEW.artist_id
    LOOP
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (
        fan_record.fan_id,
        'live_stream',
        '🔴 Live Now!',
        artist_name_var || ' is live streaming right now!',
        '/live/' || NEW.id,
        jsonb_build_object('stream_id', NEW.id, 'artist_name', artist_name_var)
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for live stream notifications
CREATE TRIGGER notify_fans_on_go_live_trigger
AFTER INSERT OR UPDATE ON public.artist_live_streams
FOR EACH ROW
EXECUTE FUNCTION public.notify_fans_on_go_live();