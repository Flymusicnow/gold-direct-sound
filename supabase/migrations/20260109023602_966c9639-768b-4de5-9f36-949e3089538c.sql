-- Add new columns for banner identity controls per SUPER CARD specification
ALTER TABLE public.artist_profiles
ADD COLUMN IF NOT EXISTS show_name_on_banner BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS banner_position_y INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS profile_theme TEXT DEFAULT 'gold';

-- Add comment for documentation
COMMENT ON COLUMN public.artist_profiles.show_name_on_banner IS 'Toggle to show/hide artist name on banner (default: true)';
COMMENT ON COLUMN public.artist_profiles.banner_position_y IS 'Y-axis position of banner (0-100%, default: 50)';
COMMENT ON COLUMN public.artist_profiles.profile_theme IS 'Color theme for profile (gold, silver, emerald, violet, ice)';