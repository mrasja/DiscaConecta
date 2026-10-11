// Argentina no tiene un registro único nacional de matrículas — cada colegio
// profesional habilita por provincia y la mayoría no expone una API pública.
// En vez de pretender "verificar" nosotros la matrícula, armamos una búsqueda
// que lleva a la familia directo al organismo correcto para que la chequee ella
// misma. Ver también Términos y Condiciones, sección 3 (Verificación de profesionales).

export const COLEGIO_LABELS: Record<string, string> = {
  psicologo:              'Colegio de Psicólogos',
  fonoaudiologo:          'Colegio de Fonoaudiólogos',
  acompanante_terapeutico: 'Registro de Acompañantes Terapéuticos',
  enfermera:              'Colegio o Asociación de Enfermería',
  docente_especial:       'organismo de educación especial de la jurisdicción',
  otro:                   'colegio u organismo profesional correspondiente',
};

export function colegioLabelFor(profession: string): string {
  return COLEGIO_LABELS[profession] ?? COLEGIO_LABELS.otro;
}

/**
 * Arma una URL de búsqueda (no un link oficial directo — no existe uno único
 * y confiable para todas las profesiones/provincias) para que el usuario
 * verifique por su cuenta una matrícula profesional.
 */
export function buildMatriculaSearchUrl(
  profession: string,
  licenseNumber: string,
  province?: string | null,
): string {
  const colegio = colegioLabelFor(profession);
  const terms = ['matrícula', licenseNumber.trim(), colegio, province?.trim(), 'verificar']
    .filter((t): t is string => !!t && t.length > 0);
  return `https://www.google.com/search?q=${encodeURIComponent(terms.join(' '))}`;
}
