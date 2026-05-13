-- Tabla para registrar publicaciones de outreach en múltiples plataformas
CREATE TABLE IF NOT EXISTS outreach_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL,   -- 'whatsapp_directory' | 'reddit' | 'facebook' | 'instagram_dm'
  target text NOT NULL,     -- e.g. 'r/Barcelona', 'Erasmus Barcelona', 'whatsgrouplinks.com'
  status text DEFAULT 'posted' CHECK (status IN ('posted', 'failed', 'pending')),
  url text,
  notes text,
  posted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS outreach_posts_platform_idx ON outreach_posts(platform);
CREATE INDEX IF NOT EXISTS outreach_posts_posted_at_idx ON outreach_posts(posted_at DESC);

ALTER TABLE outreach_posts ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden leer/escribir
CREATE POLICY "Admin full access" ON outreach_posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );
