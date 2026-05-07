/**
 * HotelWidget — SSS83 (May 2026)
 *
 * Embed Travelpayouts/Hotellook search widget con tu marker afiliado.
 * Iframe fuente: ya valida tu account TP_MARKER y reparte comisiones por click.
 */

interface Props {
  city?: string;
  destinationId?: string; // hotellook locationId opcional
  height?: number;
  className?: string;
}

const TP_MARKER = process.env.NEXT_PUBLIC_TP_MARKER || "513030";

export function HotelWidget({ city = "Barcelona", height = 380, className = "" }: Props) {
  const params = new URLSearchParams({
    marker: TP_MARKER,
    powered_by: "false",
    locale: "es",
    currency: "eur",
    destination: city,
    target_host: "search.hotellook.com/hotels",
    border_radius: "12",
  });
  const src = `//tp.media/content?${params.toString()}`;

  return (
    <div className={`rounded-2xl border border-gray-800 overflow-hidden ${className}`}>
      <div className="px-4 py-2 bg-slate-900/60 flex items-center justify-between">
        <div className="text-sm font-semibold text-white">🏨 Hoteles en {city}</div>
        <div className="text-[10px] text-gray-500">Búsqueda en 70+ webs</div>
      </div>
      <iframe
        src={src}
        loading="lazy"
        title={`Buscador de hoteles ${city}`}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        style={{ width: "100%", height: `${height}px`, border: 0 }}
      />
    </div>
  );
}
