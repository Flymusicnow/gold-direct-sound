-- Add super_admin to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Create brand_applications table for public brand partnership applications
CREATE TABLE IF NOT EXISTS public.brand_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_person text NOT NULL,
  email text NOT NULL,
  phone text,
  website text,
  company_type text NOT NULL,
  intended_use text,
  campaign_goals text,
  target_genres text[] DEFAULT '{}',
  budget_range text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on brand_applications
ALTER TABLE public.brand_applications ENABLE ROW LEVEL SECURITY;

-- Admins can manage all brand applications
CREATE POLICY "Admins can manage brand applications" ON public.brand_applications
FOR ALL USING (is_admin());

-- Anyone can submit a brand application (public form)
CREATE POLICY "Anyone can submit brand application" ON public.brand_applications
FOR INSERT WITH CHECK (true);

-- Add is_paused and admin_notes to spotlight_campaigns if not exists
ALTER TABLE public.spotlight_campaigns 
ADD COLUMN IF NOT EXISTS is_paused boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_notes text;

-- Create index for brand applications status filtering
CREATE INDEX IF NOT EXISTS idx_brand_applications_status ON public.brand_applications(status);
CREATE INDEX IF NOT EXISTS idx_brand_applications_created_at ON public.brand_applications(created_at DESC);