import Link from 'next/link';
import type { Metadata } from 'next';
import { LogoMark } from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Política de Privacidad — DiscaConecta',
  description: 'Política de privacidad y protección de datos personales de DiscaConecta, conforme a la Ley 25.326.',
};

const LAST_UPDATED = '30 de julio de 2026';
const CONTACT_EMAIL = 'm_rasja@hotmail.com';

export default function PrivacyPage() {
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
        <span className="text-gray-500 text-sm">Política de Privacidad</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 prose prose-gray prose-sm sm:prose">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
        <p className="text-gray-500 text-sm mb-8">Última actualización: {LAST_UPDATED}</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Responsable del tratamiento</h2>
          <p className="text-gray-600 leading-relaxed">
            El responsable del tratamiento de los datos personales recolectados a través de la plataforma
            DiscaConecta es <strong>DiscaConecta</strong> (en adelante, &quot;la Plataforma&quot;), con domicilio en
            la República Argentina. Para consultas relacionadas con el tratamiento de sus datos personales,
            puede comunicarse a: <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">{CONTACT_EMAIL}</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Marco legal aplicable</h2>
          <p className="text-gray-600 leading-relaxed">
            El tratamiento de datos personales en DiscaConecta se rige por la <strong>Ley N° 25.326 de Protección
            de Datos Personales</strong> de la República Argentina y sus normas reglamentarias, en particular
            el Decreto 1558/2001. Los datos de salud y discapacidad son considerados <strong>datos sensibles</strong>
            conforme al artículo 2 de dicha ley y reciben una protección especial.
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            La base de datos de DiscaConecta se encuentra registrada (o en proceso de registración) ante el{' '}
            <strong>Registro Nacional de Bases de Datos</strong> de la Agencia de Acceso a la Información
            Pública (AAIP), conforme lo exige el artículo 21 de la Ley 25.326 para toda base de datos
            que contenga datos sensibles.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Datos que recolectamos</h2>
          <div className="text-gray-600 leading-relaxed space-y-3">
            <p><strong>Datos de registro:</strong> nombre completo, dirección de correo electrónico, contraseña
            (almacenada de forma encriptada mediante Firebase Authentication), rol elegido (alumno/familia o profesional).</p>
            <p><strong>Datos del perfil de usuario:</strong> foto de perfil, número de teléfono, provincia y ciudad de residencia.</p>
            <p className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <strong>Datos sensibles (perfil alumno/familia):</strong> tipos de discapacidad del alumno,
              necesidad de acompañante terapéutico o enfermero/a. Estos datos son recolectados únicamente
              con su consentimiento expreso y son tratados con medidas de seguridad reforzadas. Su carga
              es completamente voluntaria.
            </p>
            <p><strong>Datos del perfil profesional:</strong> profesión, especialidades, matrícula profesional,
            obra social con la que trabaja, zonas de cobertura, tarifas, foto de perfil.</p>
            <p><strong>Datos de uso:</strong> búsquedas guardadas, reseñas emitidas, mensajes enviados a través
            del chat interno, historial de turnos agendados.</p>
            <p><strong>Datos técnicos:</strong> dirección IP (para limitación de tasa de uso), token de
            dispositivo (para notificaciones push), datos de sesión.</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Finalidad del tratamiento</h2>
          <ul className="text-gray-600 leading-relaxed list-disc pl-5 space-y-2">
            <li>Facilitar la búsqueda y contacto entre familias/alumnos y profesionales del área de discapacidad.</li>
            <li>Gestionar el acceso y la autenticación de usuarios en la Plataforma.</li>
            <li>Enviar notificaciones relacionadas con el servicio (nuevos profesionales, mensajes, turnos).</li>
            <li>Mejorar la experiencia de búsqueda mediante el guardado de filtros y preferencias.</li>
            <li>Prevenir fraudes y garantizar la seguridad de la Plataforma.</li>
            <li>Cumplir con obligaciones legales aplicables.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Transferencia a terceros</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            DiscaConecta utiliza los siguientes servicios de terceros para operar la Plataforma:
          </p>
          <ul className="text-gray-600 leading-relaxed list-disc pl-5 space-y-2">
            <li><strong>Google Firebase</strong> (Firebase Authentication, Realtime Database, Cloud Storage, Cloud Messaging): autenticación, chat en tiempo real, almacenamiento de imágenes y notificaciones push. Proveedor: Google LLC, EEUU.</li>
            <li><strong>Cloudinary</strong>: almacenamiento y optimización de imágenes de perfil y de reseñas.</li>
            <li><strong>Vercel</strong>: alojamiento de la aplicación web y analítica de uso anónima.</li>
            <li><strong>Neon / PostgreSQL</strong>: base de datos principal donde se almacenan los perfiles de usuarios y profesionales.</li>
            <li><strong>Upstash Redis</strong> (opcional): limitación de tasa de uso de la API.</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            Todos estos proveedores cuentan con políticas de privacidad propias y medidas de seguridad
            adecuadas. No vendemos ni cedemos sus datos a terceros con fines comerciales o publicitarios.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5 bis. Transferencia internacional de datos</h2>
          <p className="text-gray-600 leading-relaxed">
            Algunos de los proveedores mencionados en la sección anterior almacenan datos en servidores
            ubicados fuera de la República Argentina (principalmente en Estados Unidos). Conforme al
            artículo 12 de la Ley 25.326, esta transferencia internacional se realiza únicamente hacia
            proveedores que cuentan con estándares de protección de datos adecuados y con cláusulas
            contractuales de protección de datos en sus respectivos acuerdos de servicio. Puede solicitar
            más información sobre estas transferencias escribiendo a{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">{CONTACT_EMAIL}</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Consentimiento para datos sensibles</h2>
          <p className="text-gray-600 leading-relaxed">
            La carga de datos de discapacidad en el perfil del alumno/familia es completamente <strong>voluntaria</strong>.
            Al completar dicha sección, usted presta consentimiento expreso e informado para el tratamiento de
            sus datos sensibles conforme al artículo 7 de la Ley 25.326. Puede retirar este consentimiento en
            cualquier momento solicitando la eliminación de dichos datos (ver sección 8).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Menores de edad</h2>
          <p className="text-gray-600 leading-relaxed">
            DiscaConecta no está dirigida a menores de 13 años. Para registrar a un menor como alumno, el tutor
            legal debe crear la cuenta y dar su consentimiento expreso. Al registrarse, usted declara ser
            mayor de 13 años o actuar en carácter de representante legal del menor.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Sus derechos (ARCO)</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Conforme a la Ley 25.326, usted tiene derecho a:
          </p>
          <ul className="text-gray-600 leading-relaxed list-disc pl-5 space-y-2">
            <li><strong>Acceso:</strong> solicitar información sobre qué datos personales suyos tratamos.</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
            <li><strong>Cancelación / Supresión:</strong> solicitar la eliminación de sus datos cuando ya no sean necesarios para la finalidad por la que fueron recolectados.</li>
            <li><strong>Oposición:</strong> oponerse al tratamiento de sus datos en determinadas circunstancias.</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            Para ejercer cualquiera de estos derechos, puede hacerlo directamente desde su perfil en la
            aplicación (sección &quot;Eliminar cuenta&quot;), desde{' '}
            <Link href="/eliminar-cuenta" className="text-indigo-600 underline">/eliminar-cuenta</Link>{' '}
            (no requiere tener la app instalada), o enviando un correo a{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">{CONTACT_EMAIL}</a>.
            Responderemos en un plazo máximo de <strong>30 días hábiles</strong>.
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            También puede presentar una reclamación ante la <strong>Agencia de Acceso a la Información
            Pública (AAIP)</strong> en <a href="https://www.aaip.gob.ar" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">www.aaip.gob.ar</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Seguridad</h2>
          <p className="text-gray-600 leading-relaxed">
            Implementamos medidas técnicas y organizativas para proteger sus datos personales, incluyendo:
            cifrado en tránsito (HTTPS/TLS), autenticación segura mediante Firebase, control de acceso por
            roles, y limitación de tasa de peticiones. Los datos sensibles de discapacidad solo son
            accesibles por el propio usuario y por el personal autorizado de la Plataforma.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Conservación de datos</h2>
          <p className="text-gray-600 leading-relaxed">
            Conservamos sus datos mientras mantenga una cuenta activa en la Plataforma. Una vez eliminada
            su cuenta, sus datos personales serán suprimidos en un plazo máximo de 30 días, salvo aquellos
            que deban conservarse por obligación legal. Los mensajes de chat pueden quedar en los registros
            de Firebase Realtime Database por hasta 90 días antes de su eliminación definitiva.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">11. Cambios en esta política</h2>
          <p className="text-gray-600 leading-relaxed">
            Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos de cambios
            significativos mediante un aviso en la aplicación o por correo electrónico. El uso continuado
            de la Plataforma tras la publicación de cambios implica su aceptación.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">12. Contacto</h2>
          <p className="text-gray-600 leading-relaxed">
            Para cualquier consulta sobre esta Política de Privacidad o sobre el tratamiento de sus datos:
            <br />
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">{CONTACT_EMAIL}</a>
          </p>
        </section>
      </main>

      <footer className="border-t border-gray-100 px-6 py-6 text-center text-xs text-gray-400">
        <div className="flex justify-center gap-6 mb-2 flex-wrap">
          <Link href="/terminos" className="hover:text-gray-600">Términos y Condiciones</Link>
          <Link href="/privacidad" className="hover:text-gray-600 text-gray-600 font-medium">Política de Privacidad</Link>
          <Link href="/eliminar-cuenta" className="hover:text-gray-600">Eliminar cuenta</Link>
          <Link href="/" className="hover:text-gray-600">Inicio</Link>
        </div>
        <p>© {new Date().getFullYear()} DiscaConecta</p>
      </footer>
    </div>
  );
}
