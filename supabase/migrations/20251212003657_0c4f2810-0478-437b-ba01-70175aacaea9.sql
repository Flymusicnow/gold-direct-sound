-- Create is_super_admin function (using text comparison to avoid enum issue)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = 'super_admin'
  )
$$;

-- Create GDPR export function
CREATE OR REPLACE FUNCTION public.admin_export_user_data(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(p) FROM profiles p WHERE p.id = target_user_id),
    'roles', (SELECT jsonb_agg(role) FROM user_roles WHERE user_id = target_user_id),
    'artist_profile', (SELECT row_to_json(ap) FROM artist_profiles ap WHERE ap.user_id = target_user_id),
    'tracks', (SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM tracks t WHERE t.artist_id IN (SELECT id FROM artist_profiles WHERE user_id = target_user_id)),
    'comments', (SELECT COALESCE(jsonb_agg(c), '[]'::jsonb) FROM comments c WHERE c.user_id = target_user_id),
    'follows', (SELECT COALESCE(jsonb_agg(f), '[]'::jsonb) FROM follows f WHERE f.fan_id = target_user_id),
    'likes', (SELECT COALESCE(jsonb_agg(l), '[]'::jsonb) FROM likes l WHERE l.user_id = target_user_id),
    'playlists', (SELECT COALESCE(jsonb_agg(pl), '[]'::jsonb) FROM playlists pl WHERE pl.user_id = target_user_id)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Create GDPR delete function  
CREATE OR REPLACE FUNCTION public.admin_delete_user_data(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  DELETE FROM comments WHERE user_id = target_user_id;
  DELETE FROM likes WHERE user_id = target_user_id;
  DELETE FROM follows WHERE fan_id = target_user_id;
  DELETE FROM playlist_tracks WHERE playlist_id IN (SELECT id FROM playlists WHERE user_id = target_user_id);
  DELETE FROM playlists WHERE user_id = target_user_id;
  DELETE FROM user_roles WHERE user_id = target_user_id;
  UPDATE profiles SET full_name = '[deleted]', avatar_url = NULL, is_suspended = true WHERE id = target_user_id;
END;
$$;