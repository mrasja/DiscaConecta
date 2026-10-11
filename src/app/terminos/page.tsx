import Link from 'next/link';
import type { Metadata } from 'next';
import { LogoMark } from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Términos y Condiciones — DiscaConecta',
  description: 'Términos y condiciones de uso de la plataforma DiscaConecta.',
};

const LAST_UPDATED = '20 de mayo de 2026';
const CONTACT_EMAIL = 'm_rasja@hotmail.com';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <LogoMark className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-gray-900">DiscaConecta</span>
        </Link>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500 text-sm">Términos y Condiciones</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Términos y Condiciones de Uso</h1>
        <p className="text-gray-500 text-sm mb-8">Última actualización: {LAST_UPDATED}</p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
          <p className="text-amber-800 text-sm font-medium leading-relaxed">
            <strong>Importante:</strong> DiscaConecta es una plataforma de contacto entre familias y profesionales.
            No es un prestador de servicios de salud, no ejerce medicina ni ninguna otra disciplina de la salud,
            y no garantiza la calidad, idoneidad o resultado de los servicios prestados por los profesionales
            registrados en la Plataforma.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Objeto</h2>
          <p className="text-gray-600 leading-relaxed">
            DiscaConecta (en adelante, &quot;la Plataforma&quot;) es un servicio digital que facilita el contacto
            entre familias o personas con discapacidad (&quot;Alumnos/Familias&quot;) y profesionales del
            área de discapacidad (&quot;Profesionales&quot;). Los presentes Términos y Condiciones regulan
            el acceso y uso de la Plataforma. Al registrarse, usted declara haber leído, entendido y aceptado
            estos Términos en su totalidad.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Naturaleza del servicio — Plataforma intermediaria</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            DiscaConecta actúa exclusivamente como intermediario tecnológico. En consecuencia:
          </p>
          <ul className="text-gray-600 leading-relaxed list-disc pl-5 space-y-2">
            <li>La relación contractual se establece directamente entre el Alumno/Familia y el Profesional, sin intervención de DiscaConecta.</li>
            <li>DiscaConecta no es responsable de la prestación, calidad, oportunidad o resultado de los servicios profesionales acordados fuera de la Plataforma.</li>
            <li>Los honorarios, modalidad de atención y condiciones de cada servicio son acordados exclusivamente entre las partes.</li>
            <li>DiscaConecta no participa en disputas entre usuarios y profesionales relativas a la prestación del servicio.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Verificación de profesionales</h2>
          <p className="text-gray-600 leading-relaxed">
            La Plataforma realiza un proceso de verificación de identidad y habilitación profesional para
            otorgar el distintivo &quot;Verificado&quot;. Sin embargo, <strong>dicha verificación no implica
            una garantía de idoneidad, aptitud o habilitación legal vigente</strong> al momento de cada
            prestación. El usuario es responsable de corroborar la habilitación del profesional ante el
            organismo competente (colegio profesional, CONAPRIS, etc.) antes de contratar sus servicios.
            La verificación puede quedar desactualizada si el profesional pierde su habilitación con
            posterioridad al proceso de verificación.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Obligaciones del usuario</h2>
          <p className="text-gray-600 leading-relaxed mb-3">Al utilizar la Plataforma, usted se compromete a:</p>
          <ul className="text-gray-600 leading-relaxed list-disc pl-5 space-y-2">
            <li>Proveer información veraz, exacta y actualizada en su perfil.</li>
            <li>No suplantar la identidad de otra persona.</li>
            <li>No publicar contenido falso, ofensivo, discriminatorio o que viole derechos de terceros.</li>
            <li>No utilizar la Plataforma con fines ilegales o no autorizados.</li>
            <li>No intentar acceder a cuentas de otros usuarios ni a sistemas de la Plataforma.</li>
            <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            <strong>Profesionales:</strong> adicionalmente, se comprometen a mantener vigente su habilitación
            profesional y a notificar a DiscaConecta ante cualquier cambio que afecte su idoneidad legal para ejercer.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Menores de edad</h2>
          <p className="text-gray-600 leading-relaxed">
            El registro en la Plataforma requiere ser mayor de 13 años o contar con autorización del
            representante legal. Al registrarse como Alumno/Familia en nombre de un menor, el adulto
            responsable declara actuar en carácter de representante legal y presta su consentimiento
            para el tratamiento de los datos del menor. DiscaConecta no asume responsabilidad por el
            incumplimiento de este requisito.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. No es un servicio médico ni de telemedicina</h2>
          <p className="text-gray-600 leading-relaxed">
            DiscaConecta <strong>no presta servicios de salud</strong> ni constituye un sistema de telemedicina
            en los términos de la Ley 27.553. El chat interno de la Plataforma es una herramienta de
            contacto general y no debe ser utilizado para recibir diagnósticos, prescripciones médicas
            ni indicaciones clínicas. Si necesita atención médica urgente, comuníquese con los servicios
            de emergencia correspondientes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Reseñas y calificaciones</h2>
          <p className="text-gray-600 leading-relaxed">
            Las reseñas publicadas en la Plataforma son opiniones personales de los usuarios y no
            representan la posición de DiscaConecta. DiscaConecta se reserva el derecho de eliminar reseñas
            que contengan información falsa, ofensiva o que violen estos Términos. Los profesionales
            pueden reportar reseñas que consideren inadecuadas para su revisión.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Suspensión y baja de cuenta</h2>
          <p className="text-gray-600 leading-relaxed">
            DiscaConecta se reserva el derecho de suspender o eliminar cuentas que incumplan estos Términos,
            sin previo aviso y sin responsabilidad alguna. El usuario puede solicitar la baja de su cuenta
            en cualquier momento desde la configuración de su perfil o escribiendo a{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">{CONTACT_EMAIL}</a>.
            La baja implica la eliminación de sus datos conforme a la Política de Privacidad.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Limitación de responsabilidad</h2>
          <p className="text-gray-600 leading-relaxed">
            En la máxima medida permitida por la ley argentina, DiscaConecta no será responsable por daños
            directos, indirectos, incidentales, consecuentes o punitivos derivados del uso de la Plataforma,
            incluyendo —pero no limitado a— daños derivados de la prestación de servicios profesionales
            contratados a través de la Plataforma, interrupciones del servicio, pérdida de datos o acceso
            no autorizado por terceros.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Propiedad intelectual</h2>
          <p className="text-gray-600 leading-relaxed">
            Todos los derechos de propiedad intelectual sobre la Plataforma (código, diseño, marca,
            contenido propio) pertenecen a DiscaConecta. Se otorga al usuario una licencia limitada, no
            exclusiva e intransferible para usar la Plataforma conforme a estos Términos. Queda
            prohibida la reproducción, distribución o modificación sin autorización expresa.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">11. Ley aplicable y jurisdicción</h2>
          <p className="text-gray-600 leading-relaxed">
            Estos Términos se rigen por las leyes de la República Argentina. Ante cualquier controversia,
            las partes se someten a la jurisdicción de los Tribunales Ordinarios de la Ciudad Autónoma
            de Buenos Aires, renunciando a cualquier otro fuero que pudiera corresponderles.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">12. Modificaciones</h2>
          <p className="text-gray-600 leading-relaxed">
            DiscaConecta puede modificar estos Términos en cualquier momento. Las modificaciones entrarán en
            vigor al ser publicadas en la Plataforma. El uso continuado de la Plataforma con posterioridad
            a la publicación de cambios implica la aceptación de los Términos modificados. Para cambios
            sustanciales, se notificará a los usuarios por correo electrónico.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">13. Contacto</h2>
          <p className="text-gray-600 leading-relaxed">
            Para consultas sobre estos Términos:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">{CONTACT_EMAIL}</a>
          </p>
        </section>
      </main>

      <footer className="border-t border-gray-100 px-6 py-6 text-center text-xs text-gray-400">
        <div className="flex justify-center gap-6 mb-2 flex-wrap">
          <Link href="/terminos" className="hover:text-gray-600 text-gray-600 font-medium">Términos y Condiciones</Link>
          <Link href="/privacidad" className="hover:text-gray-600">Política de Privacidad</Link>
          <Link href="/eliminar-cuenta" className="hover:text-gray-600">Eliminar cuenta</Link>
          <Link href="/" className="hover:text-gray-600">Inicio</Link>
        </div>
        <p>© {new Date().getFullYear()} DiscaConecta</p>
      </footer>
    </div>
  );
}
