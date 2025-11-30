-- Create supporter_payments table for payment event logs
CREATE TABLE public.supporter_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.supporter_subscriptions(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text DEFAULT 'SEK',
  paid_at timestamptz NOT NULL,
  stripe_event_id text UNIQUE NOT NULL,
  stripe_invoice_id text,
  raw jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create payout_history table for artist payouts
CREATE TABLE public.payout_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  method text NOT NULL DEFAULT 'manual',
  notes text,
  paid_at timestamptz NOT NULL,
  processed_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Add early access columns to tracks
ALTER TABLE public.tracks 
ADD COLUMN supporter_early_access boolean DEFAULT false,
ADD COLUMN release_date timestamptz;

-- Add early access columns to videos
ALTER TABLE public.artist_video_posts 
ADD COLUMN supporter_early_access boolean DEFAULT false,
ADD COLUMN release_date timestamptz;

-- RLS Policies for supporter_payments
ALTER TABLE public.supporter_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fans can view own payments"
  ON public.supporter_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.supporter_subscriptions ss
      WHERE ss.id = supporter_payments.subscription_id
      AND ss.fan_user_id = auth.uid()
    )
  );

-- RLS Policies for payout_history
ALTER TABLE public.payout_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists can view own payouts"
  ON public.payout_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.artist_profiles ap
      WHERE ap.id = payout_history.artist_id
      AND ap.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all payouts"
  ON public.payout_history FOR ALL
  USING (public.is_admin());

-- Create index for performance
CREATE INDEX idx_supporter_payments_subscription ON public.supporter_payments(subscription_id);
CREATE INDEX idx_supporter_payments_stripe_event ON public.supporter_payments(stripe_event_id);
CREATE INDEX idx_payout_history_artist ON public.payout_history(artist_id);
CREATE INDEX idx_tracks_supporter_early ON public.tracks(supporter_early_access, release_date);
CREATE INDEX idx_videos_supporter_early ON public.artist_video_posts(supporter_early_access, release_date);