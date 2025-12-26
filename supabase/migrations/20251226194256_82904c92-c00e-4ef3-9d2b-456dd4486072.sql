-- Drop existing budget_range check constraints
ALTER TABLE public.collab_entities DROP CONSTRAINT IF EXISTS collab_entities_budget_range_check;
ALTER TABLE public.collab_opportunities DROP CONSTRAINT IF EXISTS collab_opportunities_budget_range_check;

-- Add new constraint with expanded values including 'enterprise'
ALTER TABLE public.collab_entities ADD CONSTRAINT collab_entities_budget_range_check 
CHECK (budget_range IS NULL OR budget_range IN ('low', 'medium', 'high', 'enterprise'));

ALTER TABLE public.collab_opportunities ADD CONSTRAINT collab_opportunities_budget_range_check 
CHECK (budget_range IS NULL OR budget_range IN ('low', 'medium', 'high', 'enterprise'));