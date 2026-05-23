/**
 * ics_builder.ts — SSS419 (May 2026)
 *
 * Genera ficheros .ics (iCalendar RFC 5545) para que los usuarios añadan
 * sus vuelos detectados a Apple Calendar / Google Calendar / Outlook /
 * Calendar.app de Linux.
 *
 * Feature Premium-friendly: añade fricción cero al "save this deal"
 * (descargar .ics) y aumenta retention porque queda en el calendario
 * del usuario como recordatorio físico hasta la fecha.
 *
 * Formato mínimo válido RFC 5545. No usamos un parser externo para
 * mantener bundle pequeño y edge-runtime compatible.
 */

export interface IcsEvent {
  /** UID estable — usar `${dealId}-out` / `${dealId}-back` */
  uid: string;
  /** "Madrid → Tokio · 299€ economy" */
  summary: string;
  /** Descripción larga (puede contener URLs) */
  description: string;
  /** ISO date "YYYY-MM-DD" — all-day event */
  date: string;
  /** Origen IATA o ciudad */
  location?: string;
  /** URL a /deals/[id] (clickeable en clientes que lo soporten) */
  url?: string;
}

const CRLF = "\r\n";

/** RFC 5545 §3.1: line folding cada 75 octetos máximo. Foldeamos a 73 por seguridad UTF-8. */
function foldLine(line: string): string {
  if (line.length <= 73) return line;
  const chunks: string[] = [];
  let i = 0;
  while (i < line.length) {
    chunks.push(line.slice(i, i + 73));
    i += 73;
  }
  return chunks.join(CRLF + " ");
}

/** Escapa según RFC 5545 §3.3.11: backslash, semicolon, comma, newline. */
function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** "YYYY-MM-DD" → "YYYYMMDD" */
function dateOnly(iso: string): string {
  return iso.replace(/-/g, "").slice(0, 8);
}

function nowStamp(): string {
  // YYYYMMDDTHHMMSSZ en UTC
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

export function buildIcs(events: IcsEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TripCazador//Deal Save//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  const stamp = nowStamp();

  for (const ev of events) {
    const startDate = dateOnly(ev.date);
    // DTEND = day + 1 para all-day events (RFC 5545)
    const next = new Date(ev.date + "T00:00:00Z");
    next.setUTCDate(next.getUTCDate() + 1);
    const endDate =
      next.getUTCFullYear().toString() +
      (next.getUTCMonth() + 1).toString().padStart(2, "0") +
      next.getUTCDate().toString().padStart(2, "0");

    lines.push(
      "BEGIN:VEVENT",
      foldLine(`UID:${ev.uid}@tripcazador.com`),
      foldLine(`DTSTAMP:${stamp}`),
      foldLine(`DTSTART;VALUE=DATE:${startDate}`),
      foldLine(`DTEND;VALUE=DATE:${endDate}`),
      foldLine(`SUMMARY:${escapeText(ev.summary)}`),
      foldLine(`DESCRIPTION:${escapeText(ev.description)}`),
    );
    if (ev.location) lines.push(foldLine(`LOCATION:${escapeText(ev.location)}`));
    if (ev.url) lines.push(foldLine(`URL:${escapeText(ev.url)}`));
    lines.push("TRANSP:TRANSPARENT", "END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join(CRLF) + CRLF;
}
