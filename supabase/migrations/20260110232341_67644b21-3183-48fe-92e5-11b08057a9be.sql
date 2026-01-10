-- Add 'spotlight_vote' to the allowed types in artist_activities
ALTER TABLE artist_activities DROP CONSTRAINT IF EXISTS artist_activities_type_check;

ALTER TABLE artist_activities ADD CONSTRAINT artist_activities_type_check 
CHECK (type = ANY (ARRAY['new_follower', 'track_liked', 'comment', 'event_created', 'spotlight_vote']));