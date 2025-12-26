-- Create brand_messages table for brand-artist communication
CREATE TABLE public.brand_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id UUID NOT NULL,
  recipient_user_id UUID NOT NULL,
  collab_entity_id UUID REFERENCES public.collab_entities(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.collab_applications(id) ON DELETE SET NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brand_messages ENABLE ROW LEVEL SECURITY;

-- Brands can view messages where they are sender or recipient and belong to their entity
CREATE POLICY "Users can view their own messages"
ON public.brand_messages
FOR SELECT
USING (
  auth.uid() = sender_user_id OR 
  auth.uid() = recipient_user_id
);

-- Brands can send messages (insert)
CREATE POLICY "Users can send messages"
ON public.brand_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_user_id);

-- Recipients can mark messages as read
CREATE POLICY "Recipients can update read status"
ON public.brand_messages
FOR UPDATE
USING (auth.uid() = recipient_user_id)
WITH CHECK (auth.uid() = recipient_user_id);

-- Create index for faster lookups
CREATE INDEX idx_brand_messages_sender ON public.brand_messages(sender_user_id);
CREATE INDEX idx_brand_messages_recipient ON public.brand_messages(recipient_user_id);
CREATE INDEX idx_brand_messages_entity ON public.brand_messages(collab_entity_id);
CREATE INDEX idx_brand_messages_created ON public.brand_messages(created_at DESC);