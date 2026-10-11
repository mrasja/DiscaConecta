-- Trazabilidad del consentimiento expreso para datos sensibles (Ley 25.326 art. 7)
-- y de la declaración de mayoría de edad / representación legal del tutor.
-- Correr manualmente contra la base y luego `npm run db:pull`.

ALTER TABLE students ADD COLUMN IF NOT EXISTS sensitive_data_consent_at timestamptz;
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_declaration boolean DEFAULT false;
