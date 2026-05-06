/**
 * wallet_pass.ts — F9 (May 2026)
 *
 * Genera Google Wallet (Save URL) + Apple Wallet pass.json signing stub.
 *
 * Apple Wallet (.pkpass) requiere certificado Apple Developer ($99/año) que
 * todavía no tenemos. Por ahora generamos solamente la "fake" pass.json que
 * cualquier libpass-compatible puede empaquetar; cuando Ernesto consiga el
 * cert, sólo hay que firmar el manifest con OpenSSL en el endpoint.
 *
 * Google Wallet sí podemos generar JWT firmado con cuenta de servicio.
 * Por ahora retornamos generic-pass JSON apto para ambas plataformas.
 */

export type AlertPassData = {
  alert_id: string;
  origin_iata: string;
  origin_city: string;
  destination_iata: string;
  destination_city: string;
  target_price_eur: number;
  current_price_eur?: number;
  date_out?: string;
  user_email_hash?: string;
};

const PASS_TYPE_ID = "pass.com.tripcazador.priceAlert";
const TEAM_ID = process.env.APPLE_WALLET_TEAM_ID || "TEAM_ID_PLACEHOLDER";

export function buildPassJson(data: AlertPassData): Record<string, unknown> {
  const dropPct =
    data.current_price_eur && data.current_price_eur > data.target_price_eur
      ? Math.round(((data.current_price_eur - data.target_price_eur) / data.current_price_eur) * 100)
      : 0;

  return {
    formatVersion: 1,
    passTypeIdentifier: PASS_TYPE_ID,
    serialNumber: data.alert_id,
    teamIdentifier: TEAM_ID,
    organizationName: "TripCazador",
    description: `Alerta de precio ${data.origin_iata} → ${data.destination_iata}`,
    logoText: "TripCazador",
    foregroundColor: "rgb(255, 248, 220)",
    backgroundColor: "rgb(15, 23, 42)",
    labelColor: "rgb(251, 191, 36)",
    generic: {
      primaryFields: [
        {
          key: "route",
          label: "Ruta",
          value: `${data.origin_iata} → ${data.destination_iata}`,
        },
      ],
      secondaryFields: [
        {
          key: "target",
          label: "Precio objetivo",
          value: `${data.target_price_eur}€`,
          textAlignment: "PKTextAlignmentLeft",
        },
        {
          key: "current",
          label: "Actual",
          value: data.current_price_eur ? `${data.current_price_eur}€` : "—",
          textAlignment: "PKTextAlignmentRight",
        },
      ],
      auxiliaryFields: [
        {
          key: "city",
          label: "Destino",
          value: data.destination_city,
        },
        ...(data.date_out
          ? [
              {
                key: "date",
                label: "Fecha",
                value: data.date_out,
                textAlignment: "PKTextAlignmentRight",
              },
            ]
          : []),
      ],
      backFields: [
        {
          key: "info",
          label: "Cómo funciona",
          value: `Tu alerta está activa. Te avisaremos cuando ${data.origin_iata} → ${data.destination_iata} baje de ${data.target_price_eur}€. Abre tripcazador.com/alertas para ajustar.`,
        },
        {
          key: "drop",
          label: "Drop actual",
          value: dropPct > 0 ? `-${dropPct}% del objetivo` : "Esperando subida",
        },
        {
          key: "edit",
          label: "Gestionar alerta",
          value: `https://tripcazador.com/alertas/${data.alert_id}`,
        },
      ],
    },
    barcode: {
      format: "PKBarcodeFormatQR",
      message: `https://tripcazador.com/alertas/${data.alert_id}`,
      messageEncoding: "iso-8859-1",
      altText: data.alert_id,
    },
    relevantDate: data.date_out ? `${data.date_out}T08:00:00Z` : undefined,
    locations: [],
  };
}

/** Build a Google Wallet "Save to Google Wallet" URL stub. */
export function buildGoogleWalletUrl(data: AlertPassData): string {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID || "issuer_placeholder";
  const params = new URLSearchParams({
    issuer: issuerId,
    title: `Alerta ${data.origin_iata} → ${data.destination_iata}`,
    subtitle: `Objetivo ${data.target_price_eur}€`,
    body: `Te avisamos cuando baje de ${data.target_price_eur}€`,
    deeplink: `https://tripcazador.com/alertas/${data.alert_id}`,
  });
  return `https://pay.google.com/gp/v/save?${params.toString()}`;
}
