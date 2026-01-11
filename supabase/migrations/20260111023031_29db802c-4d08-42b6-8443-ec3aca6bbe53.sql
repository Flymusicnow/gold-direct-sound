-- 1. Add 2 missing templates per SUPER CARD
INSERT INTO spotlight_templates (name, category, description, layout_config, is_premium, sort_order)
VALUES 
  ('Behind the Scenes', 'custom', 'Personal connection with fans', 
   '{"overlay": "bottom", "showCaption": true, "vibe": "casual"}', false, 6),
  ('Moment', 'custom', 'Highlight right now moments', 
   '{"overlay": "bottom", "showEmotionalText": true, "vibe": "pulse"}', false, 7);

-- 2. Add template_id to spotlight_views for analytics
ALTER TABLE spotlight_views 
ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES spotlight_templates(id);

-- 3. Add ab_test columns to spotlight_views for tracking
ALTER TABLE spotlight_views 
ADD COLUMN IF NOT EXISTS ab_test_id uuid,
ADD COLUMN IF NOT EXISTS ab_variant text CHECK (ab_variant IN ('A', 'B'));

-- 4. Add scheduled_for and publish_status columns to artist_spotlight_media
ALTER TABLE artist_spotlight_media
ADD COLUMN IF NOT EXISTS scheduled_for timestamptz,
ADD COLUMN IF NOT EXISTS publish_status text DEFAULT 'published' 
  CHECK (publish_status IN ('draft', 'scheduled', 'published'));

-- 5. Create artist_saved_templates table for "My Templates"
CREATE TABLE IF NOT EXISTS artist_saved_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  base_template_id uuid NOT NULL REFERENCES spotlight_templates(id),
  name text NOT NULL,
  template_data jsonb NOT NULL,
  thumbnail_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE artist_saved_templates ENABLE ROW LEVEL SECURITY;

-- Artists can only manage their own saved templates
CREATE POLICY "Artists can manage own saved templates" 
ON artist_saved_templates FOR ALL 
USING (artist_id IN (SELECT id FROM artist_profiles WHERE user_id = auth.uid()));

-- 6. Create spotlight_ab_tests table for A/B testing
CREATE TABLE IF NOT EXISTS spotlight_ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  variant_a_media_id uuid NOT NULL REFERENCES artist_spotlight_media(id) ON DELETE CASCADE,
  variant_b_media_id uuid NOT NULL REFERENCES artist_spotlight_media(id) ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  winner_variant text CHECK (winner_variant IN ('A', 'B')),
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE spotlight_ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists can manage own AB tests"
ON spotlight_ab_tests FOR ALL
USING (artist_id IN (SELECT id FROM artist_profiles WHERE user_id = auth.uid()));

-- Add foreign key for ab_test_id now that table exists
ALTER TABLE spotlight_views 
ADD CONSTRAINT spotlight_views_ab_test_id_fkey 
FOREIGN KEY (ab_test_id) REFERENCES spotlight_ab_tests(id) ON DELETE SET NULL;