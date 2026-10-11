import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { MapPin, CheckCircle, Phone, Mail, Globe } from 'lucide-react';
import { ReviewsSection } from '@/components/ReviewsSection';
import { BackHeader } from '@/components/BackHeader';
import { ShareButton } from '@/components/ShareButton';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const asociacion = await prisma.asociaciones.findFirst({ where: { id } });
  if (!asociacion) return { title: 'Asociación no encontrada' };
  return {
    title: `${asociacion.nombre} — DiscaConecta`,
    description: asociacion.descripcion || `Asociación en DiscaConecta`,
    openGraph: { images: asociacion.logo_url ? [asociacion.logo_url] : [] },
  };
}

export default async function AsociacionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const asociacion = await prisma.asociaciones.findFirst({ where: { id, is_active: true } });
  if (!asociacion) notFound();

  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/asociacion/${id}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name: asociacion.nombre,
    description: asociacion.descripcion,
    address: {
      '@type': 'PostalAddress',
      streetAddress: asociacion.domicilio,
      addressLocality: asociacion.localidad,
      addressRegion: asociacion.provincia,
      addressCountry: 'AR',
    },
    ...(asociacion.telefono ? { telephone: asociacion.telefono } : {}),
    ...(asociacion.email    ? { email: asociacion.email }         : {}),
    ...(asociacion.website  ? { url: asociacion.website }         : {}),
    ...(asociacion.logo_url ? { logo: asociacion.logo_url }       : {}),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BackHeader
        title={asociacion.nombre}
        subtitle="Asociación"
        fallback="/dashboard/alumno"
        rightSlot={
          <ShareButton
            url={profileUrl}
            title={asociacion.nombre}
            text={`Mirá ${asociacion.nombre} en DiscaConecta`}
          />
        }
      />

      <div className="max-w-3xl mx-auto px-4 py-8" id="main-content">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-start gap-5">
            <div className="relative flex-shrink-0">
              {asociacion.logo_url
                ? <Image src={asociacion.logo_url} alt={asociacion.nombre} width={80} height={80}
                    className="w-20 h-20 rounded-2xl object-cover" />
                : <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <span className="text-3xl">🤝</span>
                  </div>
              }
              {asociacion.is_verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white"
                  title="Asociación verificada">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{asociacion.nombre}</h1>
                {asociacion.is_verified && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                    ✓ Verificada
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1.5 text-sm text-gray-500">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {asociacion.domicilio && `${asociacion.domicilio}, `}
                  {asociacion.barrio && `${asociacion.barrio}, `}
                  {asociacion.localidad}, {asociacion.provincia}
                </span>
              </div>
            </div>
          </div>

          {asociacion.descripcion && (
            <p className="text-gray-600 text-sm leading-relaxed mt-4 pt-4 border-t border-gray-100">
              {asociacion.descripcion}
            </p>
          )}

          {/* Contacto */}
          <div className="flex flex-wrap gap-3 mt-5">
            {asociacion.telefono && (
              <a href={`tel:${asociacion.telefono}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                <Phone className="w-4 h-4" /> {asociacion.telefono}
              </a>
            )}
            {asociacion.whatsapp && (
              <a href={`https://wa.me/${asociacion.whatsapp.replace(/\D/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors">
                WhatsApp
              </a>
            )}
            {asociacion.email && (
              <a href={`mailto:${asociacion.email}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors">
                <Mail className="w-4 h-4" /> Email
              </a>
            )}
            {asociacion.website && (
              <a href={asociacion.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                <Globe className="w-4 h-4" /> Sitio web
              </a>
            )}
          </div>
        </div>

        {/* Fotos */}
        {(asociacion.fotos as string[]).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Fotos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(asociacion.fotos as string[]).map((url, i) => (
                <div key={i} className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <Image src={url} alt={`Foto ${i + 1} de ${asociacion.nombre}`} width={300} height={200}
                    className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disciplinas */}
        {(asociacion.disciplinas as string[]).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Disciplinas / actividades</h2>
            <div className="flex flex-wrap gap-2">
              {(asociacion.disciplinas as string[]).map(d => (
                <span key={d} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tipos de discapacidad */}
        {(asociacion.tipos_discapacidad as string[]).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Discapacidades atendidas</h2>
            <div className="flex flex-wrap gap-2">
              {(asociacion.tipos_discapacidad as string[]).map(t => (
                <span key={t} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium capitalize">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reseñas */}
        <ReviewsSection targetType="association" targetId={id} targetName={asociacion.nombre} />

      </div>
    </div>
  );
}
