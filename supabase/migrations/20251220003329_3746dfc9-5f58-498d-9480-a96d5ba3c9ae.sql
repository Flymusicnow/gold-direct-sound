-- Add preferred_language column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en';

-- Create changelog email subscriptions table
CREATE TABLE IF NOT EXISTS public.changelog_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  unsubscribe_token UUID DEFAULT gen_random_uuid(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.changelog_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own changelog subscriptions" 
ON public.changelog_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own changelog subscriptions" 
ON public.changelog_subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own changelog subscriptions" 
ON public.changelog_subscriptions FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own changelog subscriptions" 
ON public.changelog_subscriptions FOR DELETE 
USING (auth.uid() = user_id);

-- Admins can view all subscriptions (for sending emails)
CREATE POLICY "Admins can view all changelog subscriptions" 
ON public.changelog_subscriptions FOR SELECT 
USING (is_admin());

-- Create updated_at trigger for changelog_subscriptions
CREATE TRIGGER update_changelog_subscriptions_updated_at
BEFORE UPDATE ON public.changelog_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();