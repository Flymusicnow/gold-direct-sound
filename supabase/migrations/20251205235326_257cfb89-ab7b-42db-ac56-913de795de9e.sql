-- Add new columns to artist_presskits for V2
ALTER TABLE public.artist_presskits
ADD COLUMN IF NOT EXISTS available_for text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS availability_notes text,
ADD COLUMN IF NOT EXISTS experience_level text DEFAULT 'emerging',
ADD COLUMN IF NOT EXISTS previous_collabs text,
ADD COLUMN IF NOT EXISTS achievements_highlights text;

-- Create notification trigger for application status changes
CREATE OR REPLACE FUNCTION public.notify_artist_on_application_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  artist_user_id UUID;
  opportunity_title TEXT;
  entity_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Only trigger on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get artist user_id
  SELECT ap.user_id INTO artist_user_id
  FROM artist_profiles ap
  WHERE ap.id = NEW.artist_id;
  
  -- Get opportunity and entity info
  SELECT co.title, ce.name INTO opportunity_title, entity_name
  FROM collab_opportunities co
  JOIN collab_entities ce ON co.collab_entity_id = ce.id
  WHERE co.id = NEW.opportunity_id;
  
  -- Set notification content based on status
  CASE NEW.status
    WHEN 'viewed' THEN
      notification_title := 'Application Viewed';
      notification_message := entity_name || ' viewed your application for "' || opportunity_title || '"';
    WHEN 'accepted' THEN
      notification_title := '🎉 Application Accepted!';
      notification_message := 'Congratulations! ' || entity_name || ' accepted your application for "' || opportunity_title || '"';
    WHEN 'rejected' THEN
      notification_title := 'Application Update';
      notification_message := 'Your application for "' || opportunity_title || '" was not selected this time';
    WHEN 'shortlisted' THEN
      notification_title := '⭐ Shortlisted!';
      notification_message := 'You''ve been shortlisted for "' || opportunity_title || '" by ' || entity_name;
    ELSE
      RETURN NEW;
  END CASE;
  
  -- Insert notification
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (
    artist_user_id,
    'application_status',
    notification_title,
    notification_message,
    '/studio/opportunities',
    jsonb_build_object(
      'application_id', NEW.id,
      'opportunity_id', NEW.opportunity_id,
      'new_status', NEW.status,
      'old_status', OLD.status
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on collab_applications
DROP TRIGGER IF EXISTS on_application_status_update ON public.collab_applications;
CREATE TRIGGER on_application_status_update
  AFTER UPDATE ON public.collab_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_artist_on_application_update();

-- Enable realtime for collab_applications
ALTER PUBLICATION supabase_realtime ADD TABLE public.collab_applications;

-- Create opportunity match score function
CREATE OR REPLACE FUNCTION public.calculate_opportunity_match_score(_artist_id uuid, _opportunity_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_artist RECORD;
  v_presskit RECORD;
  v_opportunity RECORD;
  v_entity RECORD;
  v_genre_score INTEGER := 0;
  v_location_score INTEGER := 0;
  v_experience_score INTEGER := 0;
  v_collab_history_score INTEGER := 0;
  v_availability_score INTEGER := 0;
  v_engagement_score INTEGER := 0;
  v_total_score INTEGER := 0;
  v_supporter_count INTEGER := 0;
  v_total_xp NUMERIC := 0;
BEGIN
  -- Get artist profile
  SELECT * INTO v_artist FROM artist_profiles WHERE id = _artist_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Artist not found', 'totalScore', 0);
  END IF;
  
  -- Get artist's default presskit (or most recent)
  SELECT * INTO v_presskit 
  FROM artist_presskits 
  WHERE artist_id = _artist_id 
  ORDER BY is_default DESC NULLS LAST, created_at DESC 
  LIMIT 1;
  
  -- Get opportunity
  SELECT * INTO v_opportunity FROM collab_opportunities WHERE id = _opportunity_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Opportunity not found', 'totalScore', 0);
  END IF;
  
  -- Get collab entity
  SELECT * INTO v_entity FROM collab_entities WHERE id = v_opportunity.collab_entity_id;
  
  -- Get supporter count and XP
  SELECT COUNT(*) INTO v_supporter_count FROM follows WHERE artist_id = _artist_id;
  SELECT COALESCE(SUM(score), 0) INTO v_total_xp FROM fan_support_scores WHERE artist_id = _artist_id;
  
  -- GENRE MATCH (30 pts max)
  IF v_artist.genre IS NOT NULL AND v_opportunity.genres IS NOT NULL THEN
    IF v_artist.genre = ANY(v_opportunity.genres) THEN
      v_genre_score := 30;
    ELSIF EXISTS (
      SELECT 1 FROM unnest(v_opportunity.genres) g 
      WHERE LOWER(v_artist.genre) LIKE '%' || LOWER(g) || '%'
    ) THEN
      v_genre_score := 20;
    ELSIF v_entity.style_tags IS NOT NULL AND v_artist.genre = ANY(v_entity.style_tags) THEN
      v_genre_score := 15;
    ELSE
      v_genre_score := 5;
    END IF;
  END IF;
  
  -- LOCATION MATCH (20 pts max)
  IF v_opportunity.remote_ok THEN
    v_location_score := 15; -- Remote-ok gives base points
  END IF;
  IF v_artist.city IS NOT NULL AND v_opportunity.location IS NOT NULL THEN
    IF LOWER(v_artist.city) = LOWER(v_opportunity.location) THEN
      v_location_score := 20;
    ELSIF v_artist.country IS NOT NULL AND LOWER(v_artist.country) = LOWER(v_opportunity.location) THEN
      v_location_score := GREATEST(v_location_score, 15);
    END IF;
  ELSIF v_entity.location IS NOT NULL AND v_artist.city IS NOT NULL THEN
    IF LOWER(v_artist.city) = LOWER(v_entity.location) THEN
      v_location_score := GREATEST(v_location_score, 12);
    END IF;
  END IF;
  
  -- EXPERIENCE LEVEL (15 pts max)
  IF v_presskit.experience_level IS NOT NULL THEN
    CASE v_presskit.experience_level
      WHEN 'professional' THEN v_experience_score := 15;
      WHEN 'established' THEN v_experience_score := 12;
      WHEN 'emerging' THEN v_experience_score := 8;
      ELSE v_experience_score := 5;
    END CASE;
  ELSIF v_total_xp >= 500 THEN
    v_experience_score := 12;
  ELSIF v_total_xp >= 100 THEN
    v_experience_score := 8;
  ELSE
    v_experience_score := 4;
  END IF;
  
  -- Adjust for opportunity requirements
  IF v_opportunity.min_xp_level IS NOT NULL THEN
    CASE v_opportunity.min_xp_level
      WHEN 'professional' THEN
        IF v_presskit.experience_level != 'professional' THEN
          v_experience_score := v_experience_score - 5;
        END IF;
      WHEN 'established' THEN
        IF v_presskit.experience_level = 'emerging' THEN
          v_experience_score := v_experience_score - 3;
        END IF;
      ELSE NULL;
    END CASE;
  END IF;
  v_experience_score := GREATEST(v_experience_score, 0);
  
  -- COLLABORATION HISTORY (15 pts max)
  IF v_presskit.previous_collabs IS NOT NULL AND LENGTH(v_presskit.previous_collabs) > 20 THEN
    v_collab_history_score := 15;
  ELSIF v_presskit.previous_collabs IS NOT NULL AND LENGTH(v_presskit.previous_collabs) > 0 THEN
    v_collab_history_score := 10;
  ELSIF EXISTS(SELECT 1 FROM track_collaborators WHERE collaborator_artist_id = _artist_id AND status = 'accepted') THEN
    v_collab_history_score := 8;
  ELSE
    v_collab_history_score := 3;
  END IF;
  
  -- AVAILABILITY MATCH (10 pts max)
  IF v_presskit.available_for IS NOT NULL AND array_length(v_presskit.available_for, 1) > 0 THEN
    IF v_opportunity.type = ANY(v_presskit.available_for) THEN
      v_availability_score := 10;
    ELSIF 'any' = ANY(v_presskit.available_for) THEN
      v_availability_score := 8;
    ELSE
      v_availability_score := 5;
    END IF;
  ELSE
    v_availability_score := 3;
  END IF;
  
  -- ENGAGEMENT/SUPPORTERS (10 pts max)
  IF v_opportunity.min_supporters IS NOT NULL AND v_supporter_count < v_opportunity.min_supporters THEN
    v_engagement_score := 2;
  ELSIF v_supporter_count >= 100 THEN
    v_engagement_score := 10;
  ELSIF v_supporter_count >= 50 THEN
    v_engagement_score := 8;
  ELSIF v_supporter_count >= 25 THEN
    v_engagement_score := 6;
  ELSIF v_supporter_count >= 10 THEN
    v_engagement_score := 4;
  ELSE
    v_engagement_score := 2;
  END IF;
  
  -- Calculate total
  v_total_score := v_genre_score + v_location_score + v_experience_score + v_collab_history_score + v_availability_score + v_engagement_score;
  
  RETURN jsonb_build_object(
    'totalScore', v_total_score,
    'genreScore', v_genre_score,
    'locationScore', v_location_score,
    'experienceScore', v_experience_score,
    'collabHistoryScore', v_collab_history_score,
    'availabilityScore', v_availability_score,
    'engagementScore', v_engagement_score,
    'maxScore', 100,
    'artistId', _artist_id,
    'opportunityId', _opportunity_id,
    'hasDefaultPresskit', v_presskit.id IS NOT NULL
  );
END;
$$;