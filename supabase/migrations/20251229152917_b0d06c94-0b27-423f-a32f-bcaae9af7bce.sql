-- Create legal_documents table for version tracking
CREATE TABLE public.legal_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type text NOT NULL UNIQUE,
  current_version text NOT NULL DEFAULT '1.0',
  title text NOT NULL,
  document_path text NOT NULL,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  changelog text,
  requires_reaccept boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Anyone can view legal documents
CREATE POLICY "Anyone can view legal documents" 
ON public.legal_documents 
FOR SELECT 
USING (true);

-- Admins can manage legal documents
CREATE POLICY "Admins can manage legal documents" 
ON public.legal_documents 
FOR ALL 
USING (is_admin());

-- Seed initial data
INSERT INTO public.legal_documents (document_type, current_version, title, document_path) VALUES
  ('user_agreement', '1.0', 'User Agreement', '/legal/user-agreement.md'),
  ('privacy_policy', '1.0', 'Privacy Policy', '/legal/privacy-policy.md'),
  ('artist_agreement', '1.0', 'Artist Agreement', '/legal/artist-agreement.md'),
  ('fan_terms', '1.0', 'Fan Terms', '/legal/fan-terms.md'),
  ('risk_disclaimer', '1.0', 'Risk Disclaimer', '/legal/risk-disclaimer.md'),
  ('brand_portal_terms', '1.0', 'Brand Portal Terms', '/legal/brand-portal-terms.md');