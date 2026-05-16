// ============================================================
// DISCAPP — Geocodificar escuelas sin coordenadas
// Archivo: scripts/geocode-schools.ts
// Uso: npx tsx scripts/geocode-schools.ts
//
// Corre este script DESPUÉS de import-schools.ts
// para geocodificar las escuelas que quedaron sin coordenadas.
// Podés correlo múltiples veces — siempre retoma donde quedó.
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });

const LOTE = 200; // cuántas geocodificar por ejecución

async function main() {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    console.error('❌ Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en .env');
    process.exit(1);
  }

  console.log('\n📍 DISCAPP — Geocodificador de escuelas');
  console.log('─'.repeat(45));

  // Contar totales
  const stats = await prisma.$queryRaw<any[]>`
    SELECT
      COUNT(*)::int as total,
      COUNT(location)::int as con_coords,
      COUNT(*) FILTER (WHERE location IS NULL)::int as sin_coords
    FROM escuelas_especiales WHERE is_active = TRUE
  `;
  const s = stats[0];
  console.log(`Total escuelas: ${s.total}`);
  console.log(`Con coordenadas: ${s.con_coords}`);
  console.log(`Sin coordenadas: ${s.sin_coords}`);

  if (s.sin_coords === 0) {
    console.log('\n✅ Todas las escuelas ya tienen coordenadas.\n');
    await prisma.$disconnect();
    return;
  }

  // Traer las próximas sin coordenadas
  const sinUbicacion = await prisma.$queryRaw<any[]>`
    SELECT id, nombre, domicilio, localidad, jurisdiccion
    FROM escuelas_especiales
    WHERE location IS NULL AND is_active = TRUE
    ORDER BY jurisdiccion, localidad
    LIMIT ${LOTE}
  `;

  console.log(`\n⏳ Geocodificando ${sinUbicacion.length} escuelas (lote de ${LOTE})...\n`);

  let ok   = 0;
  let fail = 0;

  for (const escuela of sinUbicacion) {
    const query = encodeURIComponent(
      `${escuela.domicilio}, ${escuela.localidad}, ${escuela.jurisdiccion}, Argentina`
    );
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${key}`;

    try {
      const res  = await fetch(url);
      const data = await res.json() as any;

      if (data.status === 'OK' && data.results?.[0]) {
        const { lat, lng } = data.results[0].geometry.location;
        await prisma.$executeRaw`
          UPDATE escuelas_especiales
          SET location = ST_MakePoint(${lng}, ${lat})::geography
          WHERE id = ${escuela.id}::uuid
        `;
        ok++;
        if (ok % 50 === 0) console.log(`  ✅ ${ok} geocodificados`);
      } else {
        fail++;
      }

      // Pausa para respetar rate limit
      await new Promise(r => setTimeout(r, 25));

    } catch {
      fail++;
    }
  }

  console.log('\n' + '─'.repeat(45));
  console.log(`✅ Geocodificados: ${ok}`);
  console.log(`❌ Sin resultado:  ${fail}`);

  // Quedan pendientes?
  const pendientes = s.sin_coords - ok;
  if (pendientes > 0) {
    console.log(`\n💡 Quedan ${pendientes} escuelas sin coordenadas.`);
    console.log('   Volvé a ejecutar: npx tsx scripts/geocode-schools.ts\n');
  } else {
    console.log('\n✨ ¡Todas las escuelas tienen coordenadas!\n');
  }

  await prisma.$disconnect();
}

main().catch(async e => {
  console.error('💥 Error:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
