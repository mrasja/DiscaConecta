-- Asociaciones (clubes deportivos, asociaciones civiles, grupos de apoyo, etc.)
-- Correr manualmente contra la base (psql / Supabase SQL editor) y luego
-- `npm run db:pull` para mantener prisma/schema.prisma sincronizado.

CREATE TABLE IF NOT EXISTS asociaciones (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id      uuid REFERENCES users(id) ON DELETE CASCADE,
  nombre             text NOT NULL,
  descripcion        text,
  disciplinas        text[] NOT NULL DEFAULT '{}',
  tipos_discapacidad text[] NOT NULL DEFAULT '{}',
  domicilio          text NOT NULL,
  barrio             text,
  localidad          text NOT NULL,
  provincia          text NOT NULL,
  location           geography(Point, 4326),
  telefono           text,
  email              text,
  whatsapp           text,
  website            text,
  logo_url           text,
  fotos              text[] NOT NULL DEFAULT '{}',
  is_verified        boolean DEFAULT false,
  is_active          boolean DEFAULT true,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asociaciones_location     ON asociaciones USING gist (location);
CREATE INDEX IF NOT EXISTS idx_asociaciones_disciplinas  ON asociaciones USING gin (disciplinas);
CREATE INDEX IF NOT EXISTS idx_asociaciones_discapacidad ON asociaciones USING gin (tipos_discapacidad);
