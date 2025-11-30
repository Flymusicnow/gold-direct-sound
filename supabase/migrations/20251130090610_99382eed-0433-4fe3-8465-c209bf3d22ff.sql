-- Add watch_segments column to video_views for granular engagement tracking
ALTER TABLE video_views
ADD COLUMN watch_segments jsonb DEFAULT '[]'::jsonb;

-- Add comment explaining the data structure
COMMENT ON COLUMN video_views.watch_segments IS 'Array of watched time segments: [{start: 0, end: 10, watched_at: "2024-01-01T00:00:00Z"}]';

-- Create index for faster aggregation queries
CREATE INDEX idx_video_views_segments ON video_views USING GIN (watch_segments);

-- Add helper function to aggregate watch segments across all views for a video
CREATE OR REPLACE FUNCTION get_video_engagement_heatmap(video_id_param uuid, segment_duration integer DEFAULT 5)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  video_duration integer;
  heatmap_data jsonb;
BEGIN
  -- Get video duration
  SELECT duration_seconds INTO video_duration
  FROM artist_video_posts
  WHERE id = video_id_param;
  
  -- If duration is null or 0, return empty array
  IF video_duration IS NULL OR video_duration = 0 THEN
    RETURN '[]'::jsonb;
  END IF;
  
  -- Build heatmap by aggregating watch segments into buckets
  WITH segment_buckets AS (
    SELECT 
      generate_series(0, video_duration, segment_duration) as bucket_start
  ),
  watch_data AS (
    SELECT 
      jsonb_array_elements(watch_segments) as segment
    FROM video_views
    WHERE video_id = video_id_param
      AND watch_segments IS NOT NULL
      AND jsonb_array_length(watch_segments) > 0
  ),
  segment_views AS (
    SELECT
      (segment->>'start')::numeric as start_time,
      (segment->>'end')::numeric as end_time
    FROM watch_data
    WHERE segment->>'start' IS NOT NULL
      AND segment->>'end' IS NOT NULL
  ),
  bucket_counts AS (
    SELECT
      sb.bucket_start,
      COUNT(DISTINCT sv.*) as view_count
    FROM segment_buckets sb
    LEFT JOIN segment_views sv ON 
      sv.start_time <= sb.bucket_start + segment_duration
      AND sv.end_time >= sb.bucket_start
    GROUP BY sb.bucket_start
    ORDER BY sb.bucket_start
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'time', bucket_start,
      'views', COALESCE(view_count, 0)
    )
    ORDER BY bucket_start
  ) INTO heatmap_data
  FROM bucket_counts;
  
  RETURN COALESCE(heatmap_data, '[]'::jsonb);
END;
$$;