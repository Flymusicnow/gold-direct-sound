-- Add accepted_language column to legal_acceptances
ALTER TABLE legal_acceptances 
ADD COLUMN IF NOT EXISTS accepted_language text;

-- Insert beta_terms document (or update if exists)
INSERT INTO legal_documents (document_type, title, current_version, document_path, requires_reaccept, last_updated, changelog)
VALUES ('beta_terms', 'Terms & Conditions (Beta)', 'beta-v1.0', '/legal/beta-terms-en.md', true, '2026-01-01', NULL)
ON CONFLICT (document_type) DO UPDATE SET
  title = EXCLUDED.title,
  current_version = EXCLUDED.current_version,
  document_path = EXCLUDED.document_path,
  requires_reaccept = EXCLUDED.requires_reaccept,
  last_updated = EXCLUDED.last_updated;