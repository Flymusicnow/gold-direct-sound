-- Add category column to platform_updates table
ALTER TABLE public.platform_updates ADD COLUMN IF NOT EXISTS category TEXT;