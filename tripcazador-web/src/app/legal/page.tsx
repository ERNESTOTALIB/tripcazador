import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso legal, privacidad y cookies",
  description:
    "Información legal de TripCazador: titular, política de privacidad (RGPD/LOPDGDD), política de cookies y disclosure de afiliación.",
  alternates: { canonical: "/legal" },
  robots: { index: true, follow: true },
};

export const dynamic = "force-static";

export default function LegalPage() {
  const lastUpdated = "18 de abril de 2026";

  return (
    <article className="prose prose-invert max-w-3xl mx-auto">
      <header className="not-prose mb-8 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <span className="text-white">Legal</span>
        </div>
        <h1 className="text-4xl font-bold text-white">Aviso legal y políticas</h1>
        <p className="text-sm text-gray-500">Última actualización: {lastUpdated}</p>

        <nav className="flex flex-wrap gap-3 text-sm pt-3">
          <a href="#aviso-legal" className="text-amber-400 hover:text-amber-300">Aviso legal</a>
          <span className="text-gray-700">·</span>
          <a href="#privacidad" className="text-amber-400 hover:text-amber-300">Privacidad</a>
          <span className="text-gray-700">·</span>
          <a href="#cookies" className="text-amber-400 hover:text-amber-300">Cookies</a>
          <span className="text-gray-700">·</span>
          <a href="#afiliacion" className="text-amber-400 hover:text-amber-300">Afiliación</a>
          <span className="text-gray-700">·</span>
          <a href="#disclaimer" className="text-amber-400 hover:text-amber-300">Disclaimer</a>
        </nav>
      </header>

      <section id="aviso-legal" className="space-y-3">
        <h2 className="text-2xl font-bold text-white">1. Aviso legal</h2>
        <p className="text-gray-300">
          En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de los datos identificativos del titular del sitio web:
        </p>
        <ul className="text-gray-300 list-disc pl-6 space-y-1">
          <li><strong>Titular del sitio:</strong> Equipo TripCazador (proyecto personal sin actividad comercial directa)</li>
          <li><strong>Correo electrónico de contacto:</strong> <a href="mailto:contacto@tripcazador.com" className="text-amber-400 hover:text-amber-300">contacto@tripcazador.com</a></li>
          <li><strong>Sitio web:</strong> <a href="https://tripcazador.com" className="text-amber-400 hover:text-amber-300">https://tripcazador.com</a></li>
        </ul>
        <p className="text-gray-400 text-sm">
          TripCazador es un agregador de información de tarifas aéreas publicadas por terceros. No actuamos como agencia de viajes, no vendemos billetes y no gestionamos reservas. Toda reserva se realiza directamente con la aerolínea o agencia correspondiente en su propio sitio web. Si se requiriera identificación fiscal completa por el inicio de actividad comercial, se actualizará esta sección con los datos correspondientes.
        </p>
      </section>

      <section id="privacidad" className="space-y-3 mt-10">
        <h2 className="text-2xl font-bold text-white">2. Política de privacidad</h2>
        <p className="text-gray-300">
          Esta política cumple con el Reglamento (UE) 2016/679 (RGPD) y con la Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).
        </p>

        <h3 className="text-lg font-semibold text-white">2.1. Responsable del tratamiento</h3>
        <p className="text-gray-300">
          El responsable del tratamiento es el titular identificado en la sección 1. Para cualquier cuestión relativa a tus datos personales, puedes contactar en <a href="mailto:contacto@tripcazador.com" className="text-amber-400">contacto@tripcazador.com</a>.
        </p>

        <h3 className="text-lg font-semibold text-white">2.2. Datos que tratamos</h3>
        <ul className="text-gray-300 list-disc pl-6 space-y-1">
          <li><strong>Datos de navegación:</strong> dirección IP (anonimizada), user agent, páginas visitadas, tiempo en página. Base legal: interés legítimo (análisis agregado).</li>
          <li><strong>Datos de suscripción al bot de Telegram:</strong> tu ID de Telegram, si te suscribes voluntariamente. Base legal: consentimiento.</li>
          <li><strong>Datos de formularios:</strong> si nos contactas por correo, conservamos únicamente los datos necesarios para responder. Base legal: consentimiento.</li>
        </ul>

        <h3 className="text-lg font-semibold text-white">2.3. Finalidades</h3>
        <p className="text-gray-300">
          Analizar el uso del sitio para mejorar el servicio, enviar alertas de chollos a usuarios suscritos y atender consultas. No usamos datos para perfilar publicidad segmentada ni los vendemos a terceros.
        </p>

        <h3 className="text-lg font-semibold text-white">2.4. Plazos de conservación</h3>
        <p className="text-gray-300">
          Los datos de navegación (agregados y anónimos) se conservan 26 meses (Google Analytics). Los datos de suscripción se mantienen mientras dure la suscripción, y se eliminan en un plazo máximo de 30 días tras la baja.
        </p>

        <h3 className="text-lg font-semibold text-white">2.5. Destinatarios</h3>
        <p className="text-gray-300">
          Podemos compartir datos con los siguientes encargados del tratamiento, amparados por contratos conformes al RGPD:
        </p>
        <ul className="text-gray-300 list-disc pl-6 space-y-1">
          <li>Google Ireland Ltd. (Google Analytics 4, con anonimización de IP)</li>
          <li>Sentry.io (monitoreo de errores técnicos, sin datos personales identificables)</li>
          <li>Telegram FZ-LLC (si te suscribes al bot)</li>
          <li>Proveedor de hosting (Oracle Cloud / Hetzner, en UE)</li>
        </ul>

        <h3 className="text-lg font-semibold text-white">2.6. Tus derechos</h3>
        <p className="text-gray-300">
          Tienes derecho a acceder, rectificar, suprimir, oponerte, limitar y portar tus datos, así como a revocar el consentimiento en cualquier momento. Para ejercerlos, escribe a <a href="mailto:contacto@tripcazador.com" className="text-amber-400">contacto@tripcazador.com</a>. Si consideras que no hemos atendido tu solicitud correctamente, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-amber-400">www.aepd.es</a>).
        </p>
      </section>

      <section id="cookies" className="space-y-3 mt-10">
        <h2 className="text-2xl font-bold text-white">3. Política de cookies</h2>
        <p className="text-gray-300">
          Una cookie es un pequeño archivo que se almacena en tu dispositivo al visitar una web. Esta política detalla qué cookies utiliza TripCazador y cómo puedes gestionarlas.
        </p>

        <h3 className="text-lg font-semibold text-white">3.1. Cookies técnicas (exentas de consentimiento)</h3>
        <p className="text-gray-300">
          Necesarias para el funcionamiento del sitio (preferencia de tema, estado de navegación). No requieren consentimiento según el criterio de la AEPD.
        </p>

        <h3 className="text-lg font-semibold text-white">3.2. Cookies analíticas</h3>
        <p className="text-gray-300">
          Utilizamos Google Analytics 4 con IP anonimizada. Solo se activan si otorgas tu consentimiento expreso mediante el banner de cookies. Finalidad: análisis agregado de uso.
        </p>

        <h3 className="text-lg font-semibold text-white">3.3. Cookies de afiliación</h3>
        <p className="text-gray-300">
          Cuando haces clic en un enlace de afiliado (Travelpayouts, Skyscanner, Kiwi, etc.), el tercero puede depositar una cookie en tu navegador para atribuir la eventual reserva. La gestión de esas cookies la realiza el tercero según sus propias políticas.
        </p>

        <h3 className="text-lg font-semibold text-white">3.4. Gestión de cookies</h3>
        <p className="text-gray-300">
          Puedes configurar o revocar tu consentimiento en cualquier momento desde el banner de cookies (disponible en el pie de página). También puedes eliminar cookies desde la configuración de tu navegador.
        </p>
      </section>

      <section id="afiliacion" className="space-y-3 mt-10">
        <h2 className="text-2xl font-bold text-white">4. Disclosure de afiliación</h2>
        <p className="text-gray-300">
          TripCazador participa en programas de afiliación con Travelpayouts, Skyscanner, Kiwi.com y otras plataformas. Esto significa que, si haces clic en un enlace marcado como &quot;Reservar&quot; o &quot;Ver en [web]&quot; y completas una reserva, recibimos una pequeña comisión.
        </p>
        <p className="text-gray-300">
          <strong>Muy importante:</strong> la comisión la paga el proveedor, no tú. El precio que pagas es exactamente el mismo que verías accediendo directamente a la aerolínea. Esta afiliación es lo que nos permite mantener el servicio gratuito para los usuarios.
        </p>
        <p className="text-gray-300">
          Nunca recomendamos un chollo por tener mayor comisión. El único criterio de selección es la calidad de la tarifa (score del motor).
        </p>
      </section>

      <section id="disclaimer" className="space-y-3 mt-10">
        <h2 className="text-2xl font-bold text-white">5. Disclaimer</h2>
        <p className="text-gray-300">
          Los precios mostrados provienen de APIs y agregadores de terceros, y pueden cambiar o desaparecer en cuestión de minutos. TripCazador no garantiza la disponibilidad ni el precio final de ninguna tarifa. Es responsabilidad del usuario verificar la tarifa en la web de la aerolínea antes de completar la reserva.
        </p>
        <p className="text-gray-300">
          Un <em>error fare</em> (tarifa errónea) puede ser cancelado por la aerolínea de acuerdo con sus condiciones generales de venta. TripCazador no se responsabiliza de la cancelación de reservas por parte de terceros.
        </p>
      </section>

      <section className="mt-12 p-6 bg-gray-900 rounded-xl border border-gray-800 not-prose">
        <p className="text-sm text-gray-400">
          Para cualquier cuestión legal, contacta en{" "}
          <a href="mailto:contacto@tripcazador.com" className="text-amber-400 hover:text-amber-300">
            contacto@tripcazador.com
          </a>
          . Para cuestiones de privacidad, en{" "}
          <a href="mailto:contacto@tripcazador.com" className="text-amber-400 hover:text-amber-300">
            contacto@tripcazador.com
          </a>
          .
        </p>
      </section>
    </article>
  );
}
