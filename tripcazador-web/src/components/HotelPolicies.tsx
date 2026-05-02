/**
 * HotelPolicies — fase BBB2
 *
 * Sección de políticas estándar para detalle de hotel: check-in, check-out,
 * cancelación, niños, mascotas, pago. Estos datos son típicos por categoría
 * — Booking ofrece políticas específicas pero requieren scraping continuo.
 *
 * Server-renderizable.
 */
import type { HotelCategory } from "@/lib/hotel_seed";

interface HotelPoliciesProps {
  category: HotelCategory;
  hotelName: string;
  className?: string;
}

interface PolicySet {
  checkIn: string;
  checkOut: string;
  cancellation: string;
  children: string;
  pets: string;
  payment: string;
  internet: string;
  parking: string;
}

const POLICIES_BY_CAT: Record<HotelCategory, PolicySet> = {
  beach: {
    checkIn: "A partir de las 15:00",
    checkOut: "Hasta las 11:00",
    cancellation: "Cancelación gratuita hasta 48 h antes (en la mayoría de tarifas).",
    children: "Bienvenidos. Niños menores de 6 años se alojan gratis con padres en cama existente.",
    pets: "No se admiten mascotas (consultar excepciones).",
    payment: "Tarjeta de crédito al hacer check-in. Visa, Mastercard, Amex.",
    internet: "Wi-Fi gratuito en todas las áreas.",
    parking: "Aparcamiento gratuito disponible (sujeto a disponibilidad).",
  },
  city: {
    checkIn: "A partir de las 14:00",
    checkOut: "Hasta las 12:00",
    cancellation: "Cancelación gratuita hasta 24 h antes en tarifas flexibles.",
    children: "Bienvenidos. Cunas gratuitas bajo petición.",
    pets: "Mascotas pequeñas (<10 kg) admitidas con suplemento de 15-25 €/noche.",
    payment: "Tarjeta de crédito al hacer check-in. Visa, Mastercard, Amex, Diners.",
    internet: "Wi-Fi gratuito de alta velocidad en habitación y áreas comunes.",
    parking: "Aparcamiento de pago: 18-30 €/día (sujeto a disponibilidad).",
  },
  luxury: {
    checkIn: "A partir de las 15:00 (early check-in posible bajo petición)",
    checkOut: "Hasta las 12:00 (late check-out hasta las 14:00 sin coste si hay disponibilidad)",
    cancellation: "Cancelación gratuita hasta 48 h antes en tarifas refundables.",
    children: "Bienvenidos. Servicio de niñeras disponible bajo petición (con coste).",
    pets: "Mascotas admitidas con suplemento de 30-50 €/noche. Camita y bowl incluidos.",
    payment: "Tarjeta de crédito o transferencia. Aceptamos Visa, Mastercard, Amex, Diners.",
    internet: "Wi-Fi premium gratuito (>500 Mbps) en todas las áreas.",
    parking: "Servicio de valet parking gratuito 24/7.",
  },
  family: {
    checkIn: "A partir de las 15:00",
    checkOut: "Hasta las 11:00",
    cancellation: "Cancelación gratuita hasta 7 días antes en tarifas all-inclusive.",
    children: "Encantados con familias. Menores de 12 años se alojan gratis. Cunas, kids club y menú infantil.",
    pets: "No se admiten mascotas (excepción para perros de servicio).",
    payment: "Tarjeta de crédito al hacer check-in. Aceptamos Visa, Mastercard, Amex.",
    internet: "Wi-Fi gratuito en habitación y áreas comunes.",
    parking: "Aparcamiento gratuito disponible.",
  },
  budget: {
    checkIn: "A partir de las 14:00",
    checkOut: "Hasta las 11:00",
    cancellation: "Tarifas no reembolsables — modificación con coste de 1 noche.",
    children: "Bienvenidos. Suplemento de 15 €/noche por cama supletoria.",
    pets: "No se admiten mascotas.",
    payment: "Tarjeta de crédito o débito al hacer check-in.",
    internet: "Wi-Fi gratuito (puede ser limitado).",
    parking: "Aparcamiento de pago en zona azul próxima.",
  },
};

export function HotelPolicies({ category, hotelName, className = "" }: HotelPoliciesProps) {
  const p = POLICIES_BY_CAT[category] ?? POLICIES_BY_CAT.city;

  const items: Array<{ key: string; icon: string; label: string; value: string }> = [
    { key: "checkin", icon: "🕒", label: "Check-in", value: p.checkIn },
    { key: "checkout", icon: "🕐", label: "Check-out", value: p.checkOut },
    { key: "cancellation", icon: "❌", label: "Cancelación", value: p.cancellation },
    { key: "children", icon: "🧒", label: "Niños", value: p.children },
    { key: "pets", icon: "🐾", label: "Mascotas", value: p.pets },
    { key: "payment", icon: "💳", label: "Pago", value: p.payment },
    { key: "internet", icon: "📶", label: "Internet", value: p.internet },
    { key: "parking", icon: "🅿️", label: "Parking", value: p.parking },
  ];

  return (
    <section
      className={`rounded-2xl border border-gray-800 bg-gray-900/60 p-6 ${className}`}
      data-testid="hotel-policies"
      aria-labelledby="hotel-policies-heading"
    >
      <h2 id="hotel-policies-heading" className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        📋 Políticas y normas
      </h2>
      <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
        {items.map((it) => (
          <div key={it.key} data-testid={`hotel-policy-${it.key}`}>
            <dt className="flex items-center gap-2 text-sm font-semibold text-amber-200 mb-1">
              <span aria-hidden>{it.icon}</span>
              <span>{it.label}</span>
            </dt>
            <dd className="text-sm text-gray-300 leading-relaxed">{it.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-gray-500 mt-5 pt-4 border-t border-gray-800">
        Las políticas mostradas son típicas para hoteles de esta categoría. Las políticas
        específicas de <strong className="text-gray-300">{hotelName}</strong> pueden variar
        — consulta los términos exactos en Booking.com antes de reservar.
      </p>
    </section>
  );
}
