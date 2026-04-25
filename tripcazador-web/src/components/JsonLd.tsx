/**
 * Componente helper para inyectar JSON-LD structured data.
 * Renderizado server-side, sin hidratación.
 *
 * ─────────────────── Defensa XSS ───────────────────
 * `JSON.stringify` NO escapa `<`, `>` ni `&`. Si cualquier string dentro de
 * `data` contiene `</script>` (p.ej. proveniente de un campo del backend como
 * `deal.headline` o `deal.city_to`), se rompe el contexto `<script>` y se
 * ejecuta cualquier HTML/JS que venga después.
 *
 * El fix estándar (usado por Next.js, Rails, Django, etc.) es reemplazar los
 * caracteres sensibles por su secuencia Unicode escapada. Estos escapes
 * SIGUEN siendo JSON válido (el parser los decodifica) pero NUNCA pueden
 * cerrar el tag `<script>`.
 *
 * También escapamos U+2028 y U+2029 que rompen parsers de JS.
 */
function escapeJsonForScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: escapeJsonForScript(data) }}
    />
  );
}

// Exportado para tests de regresión.
export { escapeJsonForScript };
