-- Fix function search_path for security
ALTER FUNCTION public.update_engagement_on_comment() SET search_path = public;
ALTER FUNCTION public.update_engagement_on_reaction() SET search_path = public;
ALTER FUNCTION public.notify_community_on_post() SET search_path = public;