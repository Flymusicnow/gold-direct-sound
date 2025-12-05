-- Create legal_acceptances table to track user consent
CREATE TABLE public.legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  document_version TEXT NOT NULL DEFAULT '1.0',
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  UNIQUE(user_id, document_type, document_version)
);

-- Enable RLS
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

-- Users can insert their own acceptances
CREATE POLICY "Users can insert own acceptances"
ON public.legal_acceptances
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own acceptances
CREATE POLICY "Users can view own acceptances"
ON public.legal_acceptances
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all acceptances
CREATE POLICY "Admins can view all acceptances"
ON public.legal_acceptances
FOR SELECT
USING (is_admin());