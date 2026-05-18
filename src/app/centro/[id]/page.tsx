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
  const centro = await prisma.centros_terapeuticos.findFirst({ where: { id } });
  if (!centro) return { title: 'Centro no encontrado' };
  return {
    title: `${centro.nombre} — Discapp`,
    description: centro.descripcion || `${centro.tipo?.replace(/_/g, ' ')} en Discapp`,
    openGraph: { images: centro.logo_url ? [centro.logo_url] : [] },
  };
}

const TIPO_LABELS: Record<string, string> = {
  escuela_especial:   'Escuela especial',
  centro_terapeutico: 'Centro terapéutico',
  rehabilitacion:     'Rehabilitación',
  integracion:        'Integración',
  otro:               'Otro',
};

export default async function CentroDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const centro = await prisma.centros_terapeuticos.findFirst({ where: { id } });
  if (!centro) notFound();

  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/centro/${id}`;
  const tipoLabel  = TIPO_LABELS[centro.tipo ?? ''] ?? (centro.tipo ?? 'Centro');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalOrganization',
    name: centro.nombre,
    description: centro.descripcion,
    address: {
      '@type': 'PostalAddress',
      streetAddress: centro.domicilio,
      addressLocality: centro.localidad,
      addressRegion: centro.provincia,
      addressCountry: 'AR',
    },
    ...(centro.telefono ? { telephone: centro.telefono } : {}),
    ...(centro.email    ? { email: centro.email }         : {}),
    ...(centro.website  ? { url: centro.website }         : {}),
    ...(centro.logo_url ? { logo: centro.logo_url }       : {}),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BackHeader
        title={centro.nombre}
        subtitle={tipoLabel}
        fallback="/dashboard/alumno"
        rightSlot={
          <ShareButton
            url={profileUrl}
            title={centro.nombre}
            text={`Mirá ${centro.nombre} en Discapp`}
          />
        }
      />

      <div className="max-w-3xl mx-auto px-4 py-8" id="main-content">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-start gap-5">
            <div className="relative flex-shrink-0">
              {centro.logo_url
                ? <Image src={centro.logo_url} alt={centro.nombre} width={80} height={80}
                    className="w-20 h-20 rounded-2xl object-cover" />
                : <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center">
                    <span className="text-3xl">🏥</span>
                  </div>
              }
              {centro.is_verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white"
                  title="Centro verificado">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{centro.nombre}</h1>
                {centro.is_verified && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                    ✓ Verificado
                  </span>
                )}
              </div>
              <p className="text-orange-600 font-medium mt-0.5">{tipoLabel}</p>
              <div className="flex items-center gap-1 mt-1.5 text-sm text-gray-500">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {centro.domicilio && `${centro.domicilio}, `}
                  {centro.barrio && `${centro.barrio}, `}
                  {centro.localidad}, {centro.provincia}
                </span>
              </div>
            </div>
          </div>

          {centro.descripcion && (
            <p className="text-gray-600 text-sm leading-relaxed mt-4 pt-4 border-t border-gray-100">
              {centro.descripcion}
            </p>
          )}

          {/* Contacto */}
          <div className="flex flex-wrap gap-3 mt-5">
            {centro.telefono && (
              <a href={`tel:${centro.telefono}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                <Phone className="w-4 h-4" /> {centro.telefono}
              </a>
            )}
            {centro.whatsapp && (
              <a href={`https://wa.me/${centro.whatsapp.replace(/\D/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors">
                WhatsApp
              </a>
            )}
            {centro.email && (
              <a href={`mailto:${centro.email}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors">
                <Mail className="w-4 h-4" /> Email
              </a>
            )}
            {centro.website && (
              <a href={centro.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                <Globe className="w-4 h-4" /> Sitio web
              </a>
            )}
          </div>
        </div>

        {/* Fotos */}
        {(centro.fotos as string[]).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Fotos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(centro.fotos as string[]).map((url, i) => (
                <div key={i} className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <Image src={url} alt={`Foto ${i + 1} de ${centro.nombre}`} width={300} height={200}
                    className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Servicios */}
        {(centro.servicios as string[]).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Servicios</h2>
            <div className="flex flex-wrap gap-2">
              {(centro.servicios as string[]).map(s => (
                <span key={s} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tipos de discapacidad */}
        {(centro.tipos_discapacidad as string[]).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Discapacidades atendidas</h2>
            <div className="flex flex-wrap gap-2">
              {(centro.tipos_discapacidad as string[]).map(t => (
                <span key={t} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium capitalize">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reseñas */}
        <ReviewsSection targetType="center" targetId={id} targetName={centro.nombre} />

      </div>
    </div>
  );
}
