/**
 * TripCazador — EmptyRadar
 *
 * Empty-state ilustrado estilo "radar" que refuerza la metáfora central
 * de la marca (rastrear, cazar). Lo usamos cuando no hay deals listos
 * aún o cuando una vista queda vacía tras filtros.
 *
 * SVG inline para evitar request extra y permitir que anime en CSS.
 * Los anillos pulsan con un delay escalonado simulando barrido radar.
 */

interface EmptyRadarProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function EmptyRadar({
  title = "El motor está rastreando…",
  subtitle = "Estamos comprobando aeropuertos y aerolíneas. Vuelve en unas horas o suscríbete al Telegram para no perderte el próximo chollo.",
  children,
}: EmptyRadarProps) {
  return (
    <div className="panel text-center py-16 px-6">
      <div className="mx-auto w-32 h-32 relative" aria-hidden="true">
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full"
          role="img"
          aria-label="Radar rastreando"
        >
          {/* Anillos concéntricos pulsantes */}
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(245,158,11,0.18)" strokeWidth="1" className="radar-ring radar-ring-1" />
          <circle cx="60" cy="60" r="38" fill="none" stroke="rgba(245,158,11,0.28)" strokeWidth="1" className="radar-ring radar-ring-2" />
          <circle cx="60" cy="60" r="22" fill="none" stroke="rgba(245,158,11,0.4)" strokeWidth="1" className="radar-ring radar-ring-3" />

          {/* Cruz de ejes */}
          <line x1="10" y1="60" x2="110" y2="60" stroke="rgba(245,158,11,0.2)" strokeWidth="0.6" strokeDasharray="2 3" />
          <line x1="60" y1="10" x2="60" y2="110" stroke="rgba(245,158,11,0.2)" strokeWidth="0.6" strokeDasharray="2 3" />

          {/* Barrido giratorio */}
          <g className="radar-sweep" style={{ transformOrigin: "60px 60px" }}>
            <defs>
              <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(245,158,11,0)" />
                <stop offset="100%" stopColor="rgba(245,158,11,0.55)" />
              </linearGradient>
            </defs>
            <path d="M60,60 L110,60 A50,50 0 0 0 92,24 Z" fill="url(#sweep)" />
          </g>

          {/* Blips */}
          <circle cx="82" cy="40" r="1.8" fill="#f59e0b" className="radar-blip radar-blip-1" />
          <circle cx="36" cy="78" r="1.5" fill="#f59e0b" className="radar-blip radar-blip-2" />
          <circle cx="74" cy="86" r="1.2" fill="#f59e0b" className="radar-blip radar-blip-3" />

          {/* Centro */}
          <circle cx="60" cy="60" r="3" fill="#f59e0b" />
          <circle cx="60" cy="60" r="3" fill="none" stroke="#fbbf24" strokeWidth="1" className="radar-ring radar-ring-1" />
        </svg>
      </div>

      <h3 className="text-xl text-white font-semibold mt-4">{title}</h3>
      <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">{subtitle}</p>
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

export default EmptyRadar;
