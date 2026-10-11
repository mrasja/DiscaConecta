// ============================================================
// DISCACONECTA — Importador de Escuelas Especiales
// Archivo: scripts/import-schools.ts
//
// Columnas del Excel (padrón oficial Ministerio de Educación):
//   Jurisdicción, Sector, Ámbito, Departamento,
//   Código de departamento, Localidad, Código de localidad,
//   Cueanexo, Nombre, Domicilio, C. P., Teléfono, Mail,
//   Especial (1 = es escuela especial),
//   Nivel inicial - Educación temprana (1 = tiene)
//   Nivel inicial - Jardín de infantes (1 = tiene)
//   Primario (1 = tiene)
//   Secundario (1 = tiene)
//   Integración a la modalidad común/ adultos (1 = tiene)
// ============================================================

import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient({ log: ['error'] });

// ─── Tipo que representa una fila del Excel ───────────────────
interface PadronRow {
  'Jurisdicción':                              string;
  'Sector':                                    string;
  'Ámbito':                                    string;
  'Departamento':                              string;
  'Código de departamento':                    number;
  'Localidad':                                 string;
  'Código de localidad':                       number;
  'Cueanexo':                                  number | string;
  'Nombre':                                    string;
  'Domicilio':                                 string;
  'C. P.':                                     string | number;
  'Teléfono':                                  string | number;
  'Mail':                                      string;
  'Especial':                                  number;
  'Nivel inicial - Educación temprana':        number;
  'Nivel inicial - Jardín de infantes':        number;
  'Primario':                                  number;
  'Secundario':                                number;
  'Integración a la modalidad común/ adultos': number;
}

// ─── Helpers ──────────────────────────────────────────────────
const esEspecial = (row: PadronRow): boolean =>
  Number(row['Especial']) === 1;

const tieneNivel = (row: PadronRow, col: string): boolean =>
  Number((row as any)[col]) === 1;

const limpiarTexto = (val: any): string =>
  val ? String(val).trim() : '';

const limpiarTelefono = (val: any): string | null => {
  if (!val) return null;
  const s = String(val).trim();
  return s.length > 0 ? s.slice(0, 100) : null;
};

const limpiarEmail = (val: any): string | null => {
  if (!val) return null;
  // Si hay múltiples emails separados por / o espacio, tomar el primero
  const s = String(val).trim().split(/[/\s]/)[0].trim().toLowerCase();
  return s.includes('@') ? s.slice(0, 200) : null;
};

// ─── Geocodificar con Google Maps ─────────────────────────────
async function geocodificar(
  domicilio: string,
  localidad: string,
  jurisdiccion: string
): Promise<{ lat: number; lng: number } | null> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  const query = encodeURIComponent(
    `${domicilio}, ${localidad}, ${jurisdiccion}, Argentina`
  );
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${key}`;

  try {
    const res  = await fetch(url);
    const data = await res.json() as any;
    if (data.status === 'OK' && data.results?.[0]) {
      const loc = data.results[0].geometry.location;
      return { lat: loc.lat, lng: loc.lng };
    }
  } catch {}
  return null;
}

// ─── MAIN ─────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 DISCACONECTA — Importador de Escuelas Especiales');
  console.log('─'.repeat(55));

  // Leer Excel
  const filePath = path.join(process.cwd(), 'data', 'padron.xlsx');
  console.log(`📂 Leyendo: ${filePath}`);

  const workbook  = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const todasLasFilas: PadronRow[] = XLSX.utils.sheet_to_json(
    workbook.Sheets[sheetName],
    { defval: null } // celdas vacías = null en vez de undefined
  );

  console.log(`📄 Total establecimientos en el Excel: ${todasLasFilas.length}`);

  // Filtrar solo las que tienen Especial = 1
  const especiales = todasLasFilas.filter(esEspecial);
  console.log(`🏫 Escuelas especiales (Especial = 1): ${especiales.length}`);

  // Mostrar distribución por jurisdicción
  const porJurisdiccion: Record<string, number> = {};
  especiales.forEach(r => {
    const j = limpiarTexto(r['Jurisdicción']) || 'Sin jurisdicción';
    porJurisdiccion[j] = (porJurisdiccion[j] || 0) + 1;
  });
  console.log('\n📊 Distribución por jurisdicción:');
  Object.entries(porJurisdiccion)
    .sort((a, b) => b[1] - a[1])
    .forEach(([j, n]) => console.log(`   ${j}: ${n}`));
  console.log('─'.repeat(55));

  let importados   = 0;
  let duplicados   = 0;
  let errores      = 0;
  let geocodificados = 0;
  const LIMITE_GEOCODING = 500; // para no gastar toda la quota de una vez

  console.log('\n⏳ Iniciando importación...\n');

  for (let i = 0; i < especiales.length; i++) {
    const row = especiales[i];

    const cueanexo    = limpiarTexto(row['Cueanexo']);
    const nombre      = limpiarTexto(row['Nombre']);
    const domicilio   = limpiarTexto(row['Domicilio']);
    const localidad   = limpiarTexto(row['Localidad']);
    const jurisdiccion = limpiarTexto(row['Jurisdicción']);
    const departamento = limpiarTexto(row['Departamento']);
    const codigoPostal = limpiarTexto(row['C. P.']);
    const sector      = limpiarTexto(row['Sector']) || 'Estatal';
    const ambito      = limpiarTexto(row['Ámbito']) || 'Urbano';
    const telefono    = limpiarTelefono(row['Teléfono']);
    const email       = limpiarEmail(row['Mail']);

    const nivelTemprana    = tieneNivel(row, 'Nivel inicial - Educación temprana');
    const nivelJardin      = tieneNivel(row, 'Nivel inicial - Jardín de infantes');
    const nivelPrimario    = tieneNivel(row, 'Primario');
    const nivelSecundario  = tieneNivel(row, 'Secundario');
    const nivelIntegracion = tieneNivel(row, 'Integración a la modalidad común/ adultos');

    if (!cueanexo || !nombre || !localidad || !jurisdiccion) {
      errores++;
      continue;
    }

    try {
      // Verificar si ya existe por CUE (evita duplicados si corrés el script dos veces)
      const existente = await prisma.$queryRaw<any[]>`
        SELECT id FROM escuelas_especiales WHERE cueanexo = ${cueanexo} LIMIT 1
      `;
      if (existente.length > 0) {
        duplicados++;
        continue;
      }

      // Geocodificar (solo si tenemos quota disponible)
      let lat = 0;
      let lng = 0;
      if (geocodificados < LIMITE_GEOCODING && domicilio && localidad) {
        const coords = await geocodificar(domicilio, localidad, jurisdiccion);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
          geocodificados++;
        }
        // Pausa para respetar rate limit de Google (50 req/s)
        await new Promise(r => setTimeout(r, 25));
      }

      // Insertar en la base de datos
      await prisma.$executeRaw`
        INSERT INTO escuelas_especiales (
          cueanexo, nombre, domicilio, localidad, jurisdiccion,
          departamento, codigo_postal, sector, ambito,
          nivel_temprana, nivel_jardin, nivel_primario,
          nivel_secundario, nivel_integracion,
          telefono, email,
          is_active, data_source
        ) VALUES (
          ${cueanexo},
          ${nombre},
          ${domicilio},
          ${localidad},
          ${jurisdiccion},
          ${departamento || null},
          ${codigoPostal || null},
          ${sector},
          ${ambito},
          ${nivelTemprana},
          ${nivelJardin},
          ${nivelPrimario},
          ${nivelSecundario},
          ${nivelIntegracion},
          ${telefono},
          ${email},
          TRUE,
          'padron_nacional_2024'
        )
      `;

      // Si tenemos coordenadas las guardamos
      if (lat !== 0 && lng !== 0) {
        await prisma.$executeRaw`
          UPDATE escuelas_especiales
          SET location = ST_MakePoint(${lng}, ${lat})::geography
          WHERE cueanexo = ${cueanexo}
        `;
      }

      importados++;

      // Log de progreso cada 100 registros
      if (importados % 100 === 0) {
        const pct = Math.round((i / especiales.length) * 100);
        console.log(`  ✅ ${importados}/${especiales.length} (${pct}%) | geocodificados: ${geocodificados}`);
      }

    } catch (e: any) {
      errores++;
      if (errores <= 5) {
        console.error(`  ❌ Error en ${nombre}: ${e.message}`);
      }
    }
  }

  // Resumen final
  console.log('\n' + '─'.repeat(55));
  console.log('📊 RESULTADO FINAL');
  console.log('─'.repeat(55));
  console.log(`✅ Importados:        ${importados}`);
  console.log(`⏭️  Duplicados:        ${duplicados}`);
  console.log(`📍 Geocodificados:    ${geocodificados}`);
  console.log(`❌ Errores/saltados:  ${errores}`);
  console.log('─'.repeat(55));

  if (importados > 0 && geocodificados < importados) {
    console.log(`\n💡 Quedan ${importados - geocodificados} escuelas sin coordenadas.`);
    console.log('   Ejecutá: npx tsx scripts/geocode-schools.ts');
    console.log('   para geocodificar el resto en tandas.\n');
  }

  // Verificación final en la DB
  const total = await prisma.$queryRaw<any[]>`
    SELECT COUNT(*)::int as total,
           COUNT(location)::int as con_ubicacion
    FROM escuelas_especiales
  `;
  console.log(`\n📈 En la base de datos:`);
  console.log(`   Total: ${(total[0] as any).total}`);
  console.log(`   Con coordenadas: ${(total[0] as any).con_ubicacion}`);
  console.log(`   Sin coordenadas: ${(total[0] as any).total - (total[0] as any).con_ubicacion}\n`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('\n💥 Error fatal:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
