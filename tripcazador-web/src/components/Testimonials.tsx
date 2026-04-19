/**
 * Testimonios / social proof.
 *
 * IMPORTANTE: testimonios marcados como placeholder hasta tener usuarios reales.
 * Sustituir por feedback real del canal de Telegram antes de lanzar en público.
 * Mientras tanto, se renderiza sólo si TESTIMONIALS_ENABLED=1 en entorno público,
 * para evitar afirmaciones falsas ante la AEPD / LSSI-CE.
 */

type Testimonial = {
  name: string;       // Nombre o inicial + apellido
  location: string;   // Ciudad, país — ayuda a contextualizar
  quote: string;      // ≤ 240 chars, frase directa
  savings: string;    // ej: "−68% sobre precio normal"
  verified: boolean;  // true = procede de feedback genuino del canal
};

// Cuando tengamos testimonios reales, sustituir `verified: false` por true
// y actualizar la prop `enabled` desde el entorno.
const TESTIMONIALS: Testimonial[] = [
  {
    name: "Marta G.",
    location: "Basilea, Suiza",
    quote: "Me pilló un Business BSL→Tokio por 950€. Hubiese pagado 3.500€ por el mismo vuelo una semana después. Increíble.",
    savings: "−73%",
    verified: false,
  },
  {
    name: "David R.",
    location: "Madrid, España",
    quote: "El bot me avisó de un error fare a Zanzíbar a las 2 AM. Reservé en 4 minutos. Al día siguiente ya estaba cerrado.",
    savings: "−65%",
    verified: false,
  },
  {
    name: "Laura P.",
    location: "Frankfurt, Alemania",
    quote: "Usaba Google Flights toda la mañana. Con el canal de Telegram me llegan antes de que aparezcan en buscadores.",
    savings: "−52%",
    verified: false,
  },
];

export function Testimonials({ enabled = false }: { enabled?: boolean }) {
  if (!enabled) {
    // Placeholder genérico sin atribución (legal y ético): social proof agregada.
    return (
      <section className="panel p-8" aria-labelledby="social-proof-heading">
        <h2 id="social-proof-heading" className="text-2xl font-bold text-white mb-6">
          Lo que tracks el motor cada día
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-amber-400" aria-hidden="true">216</div>
            <div className="text-sm text-gray-300 mt-1">aerolíneas monitorizadas</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-amber-400" aria-hidden="true">321</div>
            <div className="text-sm text-gray-300 mt-1">aeropuertos en el radar</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-amber-400" aria-hidden="true">24/7</div>
            <div className="text-sm text-gray-300 mt-1">escaneo automático cada 6h</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6" aria-labelledby="testimonials-heading">
      <h2 id="testimonials-heading" className="text-2xl font-bold text-white text-center">
        Lo que dicen los cazadores
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TESTIMONIALS.map((t) => (
          <figure
            key={t.name}
            className="glass rounded-2xl p-6 card-hover flex flex-col"
          >
            <blockquote className="text-gray-200 italic text-sm flex-1">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
              <div>
                <div className="text-white text-sm font-semibold">{t.name}</div>
                <div className="text-gray-500 text-xs">{t.location}</div>
              </div>
              <span className="text-amber-400 text-xs font-bold bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-1">
                {t.savings}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="text-center text-xs text-gray-500">
        Testimonios recopilados con consentimiento explícito de los usuarios del canal de Telegram.
      </p>
    </section>
  );
}
