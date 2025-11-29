-- Create fan_testimonials table
CREATE TABLE public.fan_testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  fan_user_id UUID NOT NULL,
  testimonial_text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fan_testimonials ENABLE ROW LEVEL SECURITY;

-- Artists can view/manage testimonials on their profile
CREATE POLICY "Artists can view testimonials on own profile"
  ON public.fan_testimonials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM artist_profiles
      WHERE artist_profiles.id = fan_testimonials.artist_id
      AND artist_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Artists can update testimonials on own profile"
  ON public.fan_testimonials
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM artist_profiles
      WHERE artist_profiles.id = fan_testimonials.artist_id
      AND artist_profiles.user_id = auth.uid()
    )
  );

-- Fans can submit testimonials
CREATE POLICY "Fans can insert testimonials"
  ON public.fan_testimonials
  FOR INSERT
  WITH CHECK (auth.uid() = fan_user_id);

CREATE POLICY "Fans can view own testimonials"
  ON public.fan_testimonials
  FOR SELECT
  USING (auth.uid() = fan_user_id);

-- Public can view approved+featured testimonials
CREATE POLICY "Public can view approved featured testimonials"
  ON public.fan_testimonials
  FOR SELECT
  USING (status = 'approved' AND is_featured = true);

-- Create updated_at trigger
CREATE TRIGGER update_fan_testimonials_updated_at
  BEFORE UPDATE ON public.fan_testimonials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_fan_testimonials_artist_id ON public.fan_testimonials(artist_id);
CREATE INDEX idx_fan_testimonials_status ON public.fan_testimonials(status);
CREATE INDEX idx_fan_testimonials_featured ON public.fan_testimonials(is_featured);