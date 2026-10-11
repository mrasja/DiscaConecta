import { describe, it, expect } from 'vitest';
import { buildMatriculaSearchUrl, colegioLabelFor, COLEGIO_LABELS } from '@/lib/matricula-verification';

describe('colegioLabelFor', () => {
  it('devuelve la etiqueta correcta para cada profesión conocida', () => {
    expect(colegioLabelFor('psicologo')).toBe('Colegio de Psicólogos');
    expect(colegioLabelFor('fonoaudiologo')).toBe('Colegio de Fonoaudiólogos');
    // Sin tilde a propósito: así está el value real en professionals.profession (CHECK constraint de la DB).
    expect(colegioLabelFor('acompanante_terapeutico')).toBe('Registro de Acompañantes Terapéuticos');
    expect(colegioLabelFor('enfermera')).toBe('Colegio o Asociación de Enfermería');
    expect(colegioLabelFor('docente_especial')).toBe('organismo de educación especial de la jurisdicción');
  });

  it('usa el fallback "otro" para profesiones desconocidas', () => {
    expect(colegioLabelFor('profesion-inexistente')).toBe(COLEGIO_LABELS.otro);
    expect(colegioLabelFor('')).toBe(COLEGIO_LABELS.otro);
  });
});

describe('buildMatriculaSearchUrl', () => {
  it('arma una URL de búsqueda de Google válida', () => {
    const url = buildMatriculaSearchUrl('psicologo', 'PSI-11111', 'Buenos Aires');
    expect(url.startsWith('https://www.google.com/search?q=')).toBe(true);
  });

  it('incluye la matrícula, el colegio y la provincia en la query', () => {
    const url = buildMatriculaSearchUrl('psicologo', 'PSI-11111', 'Buenos Aires');
    const query = decodeURIComponent(url.split('q=')[1]);
    expect(query).toContain('PSI-11111');
    expect(query).toContain('Colegio de Psicólogos');
    expect(query).toContain('Buenos Aires');
    expect(query).toContain('matrícula');
    expect(query).toContain('verificar');
  });

  it('funciona sin provincia (omite ese término sin romper la query)', () => {
    const url = buildMatriculaSearchUrl('fonoaudiologo', 'FONO-22222', null);
    const query = decodeURIComponent(url.split('q=')[1]);
    expect(query).toContain('FONO-22222');
    expect(query).toContain('Colegio de Fonoaudiólogos');
    expect(query).not.toContain('null');
    expect(query).not.toContain('undefined');
  });

  it('recorta espacios en blanco de la matrícula y la provincia', () => {
    const url = buildMatriculaSearchUrl('psicologo', '  PSI-999  ', '  Córdoba  ');
    const query = decodeURIComponent(url.split('q=')[1]);
    expect(query).toContain('PSI-999');
    expect(query).toContain('Córdoba');
    expect(query).not.toMatch(/ {2,}/); // sin dobles espacios por campos vacíos/trim
  });

  it('usa el colegio genérico para una profesión desconocida sin romper', () => {
    const url = buildMatriculaSearchUrl('kinesiologo', 'KIN-1', 'Santa Fe');
    const query = decodeURIComponent(url.split('q=')[1]);
    expect(query).toContain(COLEGIO_LABELS.otro);
    expect(query).toContain('KIN-1');
  });

  it('produce una URL codificada correctamente (sin espacios crudos)', () => {
    const url = buildMatriculaSearchUrl('psicologo', 'PSI-11111', 'Buenos Aires');
    expect(url).not.toContain(' ');
  });
});
