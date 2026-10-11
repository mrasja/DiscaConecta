// ============================================================
// DISCACONECTA — Recolector de Centros Terapéuticos via Google Places
// Archivo: scripts/collect-centers.ts
// Uso: npm run collect:centers
//
// Busca centros de rehabilitación y terapia en Argentina
// usando la Google Places Text Search API y los importa a la DB
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

// ─── Ciudades donde buscar ────────────────────────────────────
const CIUDADES = [
  { nombre: 'Buenos Aires',  lat: -34.6037, lng: -58.3816, provincia: 'Ciudad de Buenos Aires' },
  { nombre: 'La Plata',      lat: -34.9205, lng: -57.9536, provincia: 'Buenos Aires' },
  { nombre: 'Mar del Plata', lat: -38.0023, lng: -57.5575, provincia: 'Buenos Aires' },
  { nombre: 'Rosario',       lat: -32.9468, lng: -60.6393, provincia: 'Santa Fe' },
  { nombre: 'Córdoba',       lat: -31.4135, lng: -64.1811, provincia: 'Córdoba' },
  { nombre: 'Mendoza',       lat: -32.8908, lng: -68.8272, provincia: 'Mendoza' },
  { nombre: 'Tucumán',       lat: -26.8083, lng: -65.2176, provincia: 'Tucumán' },
  { nombre: 'Salta',         lat: -24.7821, lng: -65.4232, provincia: 'Salta' },
  { nombre: 'Neuquén',       lat: -38.9516, lng: -68.0591, provincia: 'Neuquén' },
  { nombre: 'Resistencia',   lat: -27.4514, lng: -58.9869, provincia: 'Chaco' },
];

// ─── Queries de búsqueda ──────────────────────────────────────
const QUERIES = [
  'centro terapéutico discapacidad',
  'centro de rehabilitación discapacidad',
  'centro educativo terapéutico',
  'CET discapacidad',
  'centro de día discapacidad',
  'estimulación temprana discapacidad',
  'centro integración discapacidad',
  'centro rehabilitación motriz',
  'centro terapia ocupacional discapacidad',
];

// ─── Tipos de centro que nos interesan ───────────────────────
const TIPOS_RELEVANTES = [
  'health', 'hospital', 'physiotherapist', 'doctor',
  'school', 'establishment'
];

// ─── Google Places Text Search ────────────────────────────────
async function searchPlaces(query: string, lat: number, lng: number): Promise<any[]> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.set('query', query);
  url.searchParams.set('location', `${lat},${lng}`);
  url.searchParams.set('radius', '15000'); // 15km
  url.searchParams.set('language', 'es');
  url.searchParams.set('key', API_KEY);

  try {
    const res = await fetch(url.toString());
    const data = await res.json();
    if (data.status === 'OK') return data.results;
    if (data.status === 'ZERO_RESULTS') return [];
    console.error(`  Places API error: ${data.status}`);
    return [];
  } catch (e) {
    console.error('  Fetch error:', e);
    return [];
  }
}

// ─── Google Places Details ────────────────────────────────────
async function getPlaceDetails(placeId: string): Promise<any | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'name,formatted_address,formatted_phone_number,website,geometry,address_components,opening_hours,rating,types');
  url.searchParams.set('language', 'es');
  url.searchParams.set('key', API_KEY);

  try {
    const res = await fetch(url.toString());
    const data = await res.json();
    return data.status === 'OK' ? data.result : null;
  } catch { return null; }
}

// ─── Extraer ciudad y provincia de address_components ─────────
function extractLocation(components: any[]): { localidad: string; provincia: string; domicilio: string } {
  const get = (type: string) =>
    components?.find((c: any) => c.types.includes(type))?.long_name || '';

  return {
    localidad: get('locality') || get('sublocality') || get('administrative_area_level_2'),
    provincia: get('administrative_area_level_1'),
    domicilio: components
      ? `${get('route')} ${get('street_number')}`.trim()
      : '',
  };
}

// ─── Determinar tipo de centro ────────────────────────────────
function determinarTipo(name: string, types: string[]): string {
  const n = name.toLowerCase();
  if (n.includes('centro de día')) return 'centro_terapeutico';
  if (n.includes('cet') || n.includes('centro educativo terapéutico')) return 'centro_terapeutico';
  if (n.includes('rehabilitación') || n.includes('rehabilitacion')) return 'centro_rehabilitacion';
  if (n.includes('estimulación') || n.includes('estimulacion')) return 'centro_terapeutico';
  if (n.includes('integración') || n.includes('integracion')) return 'centro_integracion';
  if (n.includes('terapéutico') || n.includes('terapeutico')) return 'centro_terapeutico';
  return 'centro_terapeutico';
}

// ─── MAIN ─────────────────────────────────────────────────────
async function main() {
  if (!API_KEY) {
    console.error('❌ Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en .env');
    process.exit(1);
  }

  console.log('\n🔍 DISCACONECTA — Recolector de Centros Terapéuticos\n');
  console.log(`📍 Ciudades: ${CIUDADES.length}`);
  console.log(`🔎 Queries: ${QUERIES.length}`);
  console.log(`📊 Requests estimados: ~${CIUDADES.length * QUERIES.length}\n`);
  console.log('─'.repeat(50));

  // Obtener admin user
  const admin = await prisma.users.findFirst({ where: { role: 'admin' } });
  if (!admin) { console.error('❌ No hay usuario admin'); process.exit(1); }

  let insertados = 0;
  let duplicados = 0;
  let procesados = 0;
  const placeIdsSeen = new Set<string>();

  for (const ciudad of CIUDADES) {
    console.log(`\n📍 ${ciudad.nombre}, ${ciudad.provincia}`);

    for (const query of QUERIES) {
      const fullQuery = `${query} en ${ciudad.nombre}`;
      const results = await searchPlaces(fullQuery, ciudad.lat, ciudad.lng);

      for (const place of results) {
        if (placeIdsSeen.has(place.place_id)) continue;
        placeIdsSeen.add(place.place_id);
        procesados++;

        // Verificar si ya existe
        const exists = await prisma.$queryRaw<any[]>`
          SELECT id FROM centros_terapeuticos
          WHERE nombre ILIKE ${place.name}
            AND localidad ILIKE ${`%${ciudad.nombre}%`}
          LIMIT 1
        `;

        if (exists.length > 0) { duplicados++; continue; }

        // Obtener detalles completos
        await new Promise(r => setTimeout(r, 100)); // rate limit
        const details = await getPlaceDetails(place.place_id);
        if (!details) continue;

        const loc = extractLocation(details.address_components || []);
        const coord = details.geometry?.location;
        const tipo = determinarTipo(details.name, details.types || []);

        try {
          // Insertar en DB
          const result = await prisma.$queryRaw<any[]>`
            INSERT INTO centros_terapeuticos (
              owner_user_id, nombre, tipo, domicilio,
              localidad, provincia, telefono, website,
              servicios, tipos_discapacidad, fotos,
              is_verified, is_active, data_source
            ) VALUES (
              ${admin.id}::uuid,
              ${details.name},
              ${tipo},
              ${details.formatted_address || loc.domicilio},
              ${loc.localidad || ciudad.nombre},
              ${loc.provincia || ciudad.provincia},
              ${details.formatted_phone_number || null},
              ${details.website || null},
              ARRAY[]::text[],
              ARRAY[]::text[],
              ARRAY[]::text[],
              FALSE,
              TRUE,
              'google_places'
            )
            RETURNING id
          `;

          // Actualizar coordenadas
          if (coord && result[0]?.id) {
            await prisma.$executeRaw`
              UPDATE centros_terapeuticos
              SET location = ST_MakePoint(${coord.lng}, ${coord.lat})::geography
              WHERE id = ${result[0].id}::uuid
            `;
          }

          insertados++;
          console.log(`  ✅ ${details.name}`);

        } catch (e: any) {
          if (!e.message.includes('unique')) {
            console.error(`  ❌ ${details.name}: ${e.message}`);
          } else {
            duplicados++;
          }
        }
      }

      // Pausa entre queries
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log('📊 RESUMEN');
  console.log('─'.repeat(50));
  console.log(`🔍 Places procesados: ${procesados}`);
  console.log(`✅ Insertados:        ${insertados}`);
  console.log(`⏭️  Duplicados:        ${duplicados}`);
  console.log('─'.repeat(50));
  console.log('\n💡 Los centros importados tienen is_verified=FALSE');
  console.log('   Podés verificarlos manualmente desde el panel admin.\n');

  await prisma.$disconnect();
}

main().catch(async e => {
  console.error('💥 Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});