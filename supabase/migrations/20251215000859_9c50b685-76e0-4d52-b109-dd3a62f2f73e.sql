-- Add admin_inbox_language preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS admin_inbox_language text DEFAULT 'en';

-- Add language metadata to inbox_updates table
ALTER TABLE public.inbox_updates
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';

-- Add language to resolution_details (already JSONB, no migration needed - we'll store language there)