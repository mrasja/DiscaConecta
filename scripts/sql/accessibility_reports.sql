-- Mapa colaborativo de accesibilidad hiperlocal.
-- Correr manualmente contra la base (psql / Supabase SQL editor) y luego
-- `npm run db:pull` para mantener prisma/schema.prisma sincronizado.

CREATE TABLE IF NOT EXISTS accessibility_reports (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id   uuid REFERENCES users(id) ON DELETE SET NULL,
  category      text NOT NULL CHECK (category IN ('barrera', 'acceso_positivo', 'servicio')),
  subtype       text NOT NULL,
  description   text,
  photo_url     text,
  location      geography(Point, 4326) NOT NULL,
  address       text,
  upvotes       integer NOT NULL DEFAULT 0,
  downvotes     integer NOT NULL DEFAULT 0,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accessibility_reports_location ON accessibility_reports USING gist (location);
CREATE INDEX IF NOT EXISTS idx_accessibility_reports_category ON accessibility_reports (category);
CREATE INDEX IF NOT EXISTS idx_accessibility_reports_active   ON accessibility_reports (is_active);

CREATE TABLE IF NOT EXISTS accessibility_report_votes (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id  uuid NOT NULL REFERENCES accessibility_reports(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote       smallint NOT NULL CHECK (vote IN (-1, 1)),
  created_at timestamptz DEFAULT now(),
  UNIQUE (report_id, user_id)
);
