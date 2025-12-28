-- Add invited_at and invited_by columns to beta_waitlist
ALTER TABLE public.beta_waitlist 
  ADD COLUMN IF NOT EXISTS invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS invited_by uuid;

-- Create beta_invites table for tracking sent invites
CREATE TABLE public.beta_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('fan', 'artist')),
  code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'sent', 'redeemed', 'revoked', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  redeemed_at timestamptz,
  created_by uuid,
  last_error text,
  waitlist_id uuid REFERENCES public.beta_waitlist(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX idx_beta_invites_email ON public.beta_invites(email);
CREATE INDEX idx_beta_invites_code ON public.beta_invites(code);
CREATE INDEX idx_beta_invites_status ON public.beta_invites(status);

-- Enable RLS
ALTER TABLE public.beta_invites ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for beta_invites
CREATE POLICY "Admins can view all beta_invites" 
  ON public.beta_invites FOR SELECT 
  USING (is_admin());

CREATE POLICY "Admins can insert beta_invites" 
  ON public.beta_invites FOR INSERT 
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update beta_invites" 
  ON public.beta_invites FOR UPDATE 
  USING (is_admin());

-- Update beta_waitlist RLS to allow admin updates for invited_at/invited_by
CREATE POLICY "Admins can update beta_waitlist" 
  ON public.beta_waitlist FOR UPDATE 
  USING (is_admin());