import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ContactButton } from '@/components/ContactButton';
import { ShareButton } from '@/components/ShareButton';
import { AppointmentButton } from '@/components/AppointmentButton';
import { ReferralButton } from '@/components/ReferralButton';
import { StarDisplay, ReviewModal } from '@/components/ReviewStars';
import { MapPin, CheckCircle, Briefcase, Calendar } from 'lucide-react';
import { ReviewsSection } from '@/components/ReviewsSection';
import { BackHeader } from '@/components/BackHeader';
import { buildMatriculaSearchUrl } from '@/lib/matricula-verification';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const prof = await prisma.professionals.findFirst({
    where: { id },
    include: { user: true }
  });
  if (!prof) return { title: 'Profesional no encontrado' };
    return {
    title: `${prof.user?.full_name ?? 'Profesional'} — DiscaConecta`,
    description: prof.bio || `${prof.profession} en DiscaConecta`,
    openGraph: {
        images: prof.user?.avatar_url ? [prof.user.avatar_url] : [],
    }
    };
}

export default async function ProfessionalProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const prof = await prisma.professionals.findFirst({
    where: { id },
    include: {
      user: { select: { id: true, full_name: true, avatar_url: true, email: true } }
    }
  });

  if (!prof) notFound();

  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profesional/${id}`;

  const PROFESSION_LABELS: Record<string, string> = {
    acompanante_terapeutico: 'Acompañante Terapéutico',
    enfermera: 'Enfermera/o',
    docente_especial: 'Docente de Educación Especial',
    psicologo: 'Psicólogo/a',
    fonoaudiologo: 'Fonoaudiólogo/a',
    otro: 'Profesional',
  };

  const profLabel = PROFESSION_LABELS[prof.profession] ?? prof.profession;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: prof.user?.full_name,
    jobTitle: profLabel,
    description: prof.bio,
    address: {
      '@type': 'PostalAddress',
      addressLocality: prof.city,
      addressRegion: prof.province,
      addressCountry: 'AR',
    },
    ...(prof.contact_phone ? { telephone: prof.contact_phone } : {}),
    url: profileUrl,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BackHeader
        title={prof.user?.full_name ?? 'Profesional'}
        subtitle={profLabel}
        fallback="/dashboard/alumno"
        rightSlot={
          <ShareButton
            url={profileUrl}
            title={prof.user?.full_name ?? 'Profesional'}
            text={`Mirá el perfil de ${prof.user?.full_name} en DiscaConecta`}
          />
        }
      />

    <div className="max-w-3xl mx-auto px-4 py-8" id="main-content">
      {/* Header del perfil */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="relative flex-shrink-0">
            {prof.user?.avatar_url
              ? <img src={prof.user.avatar_url} alt={prof.user.full_name}
                  className="w-20 h-20 rounded-2xl object-cover" />
              : <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center">
                  <span className="text-3xl font-bold text-indigo-600">{prof.user?.full_name[0]}</span>
                </div>
            }
            {prof.is_verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white"
                title="Matrícula verificada">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{prof.user?.full_name}</h1>
              {prof.is_verified && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                  ✓ Verificado
                </span>
              )}
            </div>
            <p className="text-indigo-600 font-medium mt-0.5">{PROFESSION_LABELS[prof.profession]}</p>
            {prof.license_number && (
              <div className="mt-0.5">
                <p className="text-sm text-gray-400">Mat. {prof.license_number}</p>
                <a
                  href={buildMatriculaSearchUrl(prof.profession, prof.license_number, prof.province)}
                  target="_blank" rel="noopener noreferrer"
                  title="Te lleva a buscar el colegio profesional correspondiente — DiscaConecta no emite ni confirma matrículas"
                  className="text-xs text-indigo-600 hover:text-indigo-800 underline underline-offset-2">
                  Verificar esta matrícula →
                </a>
              </div>
            )}
            <div className="flex items-center gap-1 mt-1.5 text-sm text-gray-500">
              <MapPin className="w-3.5 h-3.5" />
              <span>{prof.city}, {prof.province}</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {prof.bio && (
          <p className="text-gray-600 text-sm leading-relaxed mt-4 pt-4 border-t border-gray-100">
            {prof.bio}
          </p>
        )}

        {/* Botones de contacto */}
        <div className="flex flex-wrap gap-3 mt-5">
            <ContactButton
            professionalUserId={prof.user?.id ?? ''}
            professionalName={prof.user?.full_name ?? ''}
            professionalAvatar={prof.user?.avatar_url}
            whatsapp={prof.contact_whatsapp}
            phone={prof.contact_phone}
            />
            <AppointmentButton
              professionalId={prof.id}
              professionalName={prof.user?.full_name ?? 'el profesional'}
            />
            <ReferralButton
              professionalId={prof.id}
              professionalName={prof.user?.full_name ?? 'el profesional'}
            />
        </div>
      </div>

      {/* Especialidades */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-indigo-500" /> Especialidades
        </h2>
        <div className="flex flex-wrap gap-2">
          {prof.specialties.map(s => (
            <span key={s} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm capitalize font-medium">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Zonas de trabajo */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-500" /> Zonas donde trabaja
        </h2>
        <div className="flex flex-wrap gap-2">
          {prof.work_zones.map(z => (
            <span key={z} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">{z}</span>
          ))}
        </div>
      </div>

      {/* Disponibilidad */}
      {prof.availability && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" /> Disponibilidad
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(prof.availability as Record<string, string[]>).map(([day, hours]) => (
              <div key={day} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700 capitalize mb-1">{day}</p>
                {hours.map(h => (
                  <p key={h} className="text-xs text-gray-500">{h}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reseñas */}
      <ReviewsSection targetType="professional" targetId={id} targetName={prof.user?.full_name ?? ''} />

    </div>
    </div>
  );
}