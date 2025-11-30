-- Create beta_waitlist table for collecting interested user emails
CREATE TABLE public.beta_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('artist', 'fan', 'both')),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'approved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beta_waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can submit a request
CREATE POLICY "Anyone can insert beta waitlist requests"
ON public.beta_waitlist
FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Only admins can view the waitlist
CREATE POLICY "Admins can view beta waitlist"
ON public.beta_waitlist
FOR SELECT
USING (is_admin());

-- Policy: Only admins can update status
CREATE POLICY "Admins can update beta waitlist"
ON public.beta_waitlist
FOR UPDATE
USING (is_admin());

-- Create index on email for faster lookups
CREATE INDEX idx_beta_waitlist_email ON public.beta_waitlist(email);

-- Create index on status for admin filtering
CREATE INDEX idx_beta_waitlist_status ON public.beta_waitlist(status);