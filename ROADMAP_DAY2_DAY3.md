# Roadmap Día 2 + Día 3 — Datos reales + Conversión/Monetización

Esta guía continúa el plan documentado en `ROADMAP_SEMANA_MAYO_2026.md`. Está pensada
para ejecutarse después de configurar el reenvío de email (`EMAIL_ROUTING_SETUP.md`).

---

## DÍA 2 — Datos reales en vivo

**Objetivo:** que `/api/deals` y `/deals` muestren chollos *frescos cazados hoy* en lugar
de la diversificación seed estática.

### 2.1 Configurar secretos en GitHub Actions (5 min)

Necesitas tres claves. Si todavía no las tienes:

| Secret              | Dónde se obtiene                                                    | Free tier        |
|--------------------|---------------------------------------------------------------------|------------------|
| `RAPIDAPI_KEY`     | https://rapidapi.com → suscríbete a *Skyscanner Flight Search*      | 500 req/mes      |
| `SERPAPI_KEY`      | https://serpapi.com → registro                                      | 100 búsq/mes     |
| `TRAVELPAYOUTS_TOKEN` | https://travelpayouts.com → afiliado → API token                | gratis           |
| `TP_MARKER`        | Travelpayouts → tu marker de afiliado (ej. 6-7 dígitos)             | gratis           |
| `VPS_DEALS_UPLOAD_URL` | `https://api.tripcazador.com/api/admin/upload-deals`            | —                |
| `ADMIN_TOKEN`      | Generar con: `openssl rand -hex 32`                                  | —                |

**Pasos:**

1. Ve a: https://github.com/eralibahandshakes/tripcazador-web/settings/secrets/actions
2. **New repository secret** → uno por cada fila de la tabla anterior.
3. Asegúrate de que `ADMIN_TOKEN` coincida con el de `.env.prod` del VPS:
   - SSH: `cat /opt/tripcazador/.env.prod | grep ADMIN_TOKEN`
   - Si no existe, añádelo y reinicia: `cd /opt/tripcazador && docker compose restart api`

### 2.2 Disparar el primer hunt manual (2 min)

1. https://github.com/eralibahandshakes/tripcazador-web/actions/workflows/hunter-cron.yml
2. **Run workflow** → preset `all` → **Run workflow**
3. Espera ~5 min. Cuando aparezca verde, el job ha:
   - Cazado vuelos vía RapidAPI + SerpAPI
   - Generado `deals.json` con score y dedup
   - Subido al VPS via `POST /api/admin/upload-deals`
4. Verifica en producción: https://tripcazador.com/api/deals (deberías ver `count > 30` y `last_updated` reciente).

### 2.3 Smoke test desde la web (1 min)

- https://tripcazador.com/deals → grid debe mostrar resultados frescos.
- Cualquier deal → click en "Reservar" → comprobar que va a la aerolínea oficial (Ryanair/easyJet) o a Skyscanner con filtro de aerolínea (resto), nunca a Kayak.
- Los precios mostrados son aproximados (disclaimer ya añadido en fase ii).

### 2.4 Activar el cron de 6h (auto)

Una vez el hunt manual funcione, el workflow ya está programado para correr cada 6h
(`schedule: "0 */6 * * *"`). No hay que tocar nada.

### Si algo falla

- **`hunt` step falla con 401/429 RapidAPI** → secret mal copiado o cuenta sin suscripción al endpoint.
- **`upload` step falla con 401** → `ADMIN_TOKEN` desincronizado entre GH y VPS.
- **`deals.json` se sube pero la web no lo refleja** → fuerza revalidate: `curl -X POST https://tripcazador.com/api/revalidate?path=/deals -H "Authorization: Bearer <ADMIN_TOKEN>"`

---

## DÍA 3 — Conversión + Monetización

**Objetivo:** que cada click a "Reservar" deje rastro de afiliación + tracking de conversión
para optimizar a partir de datos.

### 3.1 Activar Travelpayouts marker en producción (3 min)

1. https://vercel.com/eralibahandshakes/tripcazador-web/settings/environment-variables
2. Añade (o verifica) en **Production**:
   - `NEXT_PUBLIC_BOOKING_AID` = `<tu marker Travelpayouts>` (ej. `547823`)
   - `NEXT_PUBLIC_BOOKING_LABEL` = `tripcazador`
3. **Redeploy** (Deployments → ⋮ → Redeploy).

Resultado: las URLs de Skyscanner llevarán `?aid=547823` y atribuirán comisión.

### 3.2 GA4 enhanced ecommerce events (ya cableado, verificar)

El endpoint `/api/track` ya envía a GA4 estos eventos:

- `select_item` — cuando el usuario hace click en una tarjeta de deal.
- `view_item` — cuando entra en `/deals/[id]`.
- `begin_checkout` — cuando hace click en "Reservar".

Verifica en GA4 → **Realtime** → debería aparecer `begin_checkout` con cada click a CTA.

Si no aparece:
1. Comprueba que `NEXT_PUBLIC_GA4_ID` está en Vercel (formato `G-XXXXXXXXXX`).
2. Banner de cookies → aceptar analytics. (Sin consent no se envía nada.)
3. Inspecciona `Network` → `g/collect` debe responder 200.

### 3.3 A/B Test Hero Copy (ya activo)

El componente `HeroCopyAB` rota dos variantes 50/50 vía cookie. Para revisar resultados:
1. GA4 → **Explore** → Free form
2. Dimension: `event_param_ab_variant` (custom)
3. Métrica: `engaged_sessions` y `conversions:begin_checkout`
4. Filtra por `event_name = hero_view`

A los 7 días con tráfico real podrás ver qué copy convierte mejor.

### 3.4 Newsletter — primer broadcast (10 min)

Ya tienes `NewsletterSignup` en home + posts. Cuando alcances ~50 suscriptores:
1. Resend → **Audiences** → crear segmento "Tripcazador subscribers"
2. **Broadcasts** → New → asunto `5 chollos esta semana — desde 39€`
3. Body: lista de deals destacados con `<ShareDealInline>` (ya tenemos plantilla en `email_templates/weekly_digest.html`).
4. Programar envío domingo 18h (mejor open rate en España).

### 3.5 Configurar UptimeRobot (si no está)

1. https://uptimerobot.com → free tier 50 monitors.
2. Monitor 1: `https://tripcazador.com` (HTTPS keyword "TripCazador") — interval 5 min.
3. Monitor 2: `https://api.tripcazador.com/api/health` — interval 5 min.
4. Alert contact: `ernestalib@hotmail.com` + Telegram (vía bot configurado).

---

## Resumen de bloqueadores que dependen 100% del usuario

Estos NO los puedo hacer yo desde aquí — son acciones que requieren cuenta personal de Ernesto:

- [ ] Configurar Email Routing en Cloudflare (paso EMAIL_ROUTING_SETUP.md)
- [ ] Crear cuentas RapidAPI + SerpAPI + Travelpayouts y meter las claves en GH secrets
- [ ] Generar `ADMIN_TOKEN` y sincronizarlo entre GH ↔ VPS `.env.prod`
- [ ] Disparar `Run workflow` en hunter-cron una vez (luego automático)
- [ ] Añadir `NEXT_PUBLIC_BOOKING_AID` en Vercel env vars y redeploy
- [ ] (Cuando haya tráfico) primer Resend broadcast

Una vez completes los 6 puntos anteriores, todo el sistema queda funcionando en automático.
