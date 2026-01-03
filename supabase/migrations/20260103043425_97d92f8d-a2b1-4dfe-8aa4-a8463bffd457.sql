-- Fix function search_path security warnings

-- Fix tier_level function
CREATE OR REPLACE FUNCTION tier_level(tier text)
RETURNS integer AS $$
BEGIN
  RETURN CASE tier
    WHEN 'diamond' THEN 5
    WHEN 'gold' THEN 4
    WHEN 'silver' THEN 3
    WHEN 'bronze' THEN 2
    WHEN 'free' THEN 1
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Fix create_artist_community function
CREATE OR REPLACE FUNCTION create_artist_community()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO communities (artist_id, name, description)
  VALUES (NEW.id, NEW.artist_name || '''s Community', 'Welcome to ' || NEW.artist_name || '''s community!')
  ON CONFLICT (artist_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;