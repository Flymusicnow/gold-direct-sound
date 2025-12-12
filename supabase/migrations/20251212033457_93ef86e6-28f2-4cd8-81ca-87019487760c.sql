-- Add is_suspended column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;

-- Create admin activity logs table
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view activity logs"
  ON public.admin_activity_logs
  FOR SELECT
  USING (public.is_admin());

-- Only admins can insert logs
CREATE POLICY "Admins can insert activity logs"
  ON public.admin_activity_logs
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON public.admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_target_type ON public.admin_activity_logs(target_type);