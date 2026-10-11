import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://discaconecta.com.ar';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [professionals, centros] = await Promise.all([
    prisma.professionals.findMany({
      where: { is_available: true },
      select: { id: true, updated_at: true },
    }),
    prisma.centros_terapeuticos.findMany({
      where: { is_active: true },
      select: { id: true, updated_at: true },
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                    lastModified: new Date(), changeFrequency: 'weekly',  priority: 1 },
    { url: `${BASE}/login`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/dashboard/alumno`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ];

  const professionalRoutes: MetadataRoute.Sitemap = professionals.map(p => ({
    url: `${BASE}/profesional/${p.id}`,
    lastModified: p.updated_at ?? new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const centroRoutes: MetadataRoute.Sitemap = centros.map(c => ({
    url: `${BASE}/centro/${c.id}`,
    lastModified: c.updated_at ?? new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...professionalRoutes, ...centroRoutes];
}
