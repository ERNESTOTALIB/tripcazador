# TripCazador — Lo que OBLIGATORIAMENTE tienes que hacer tú

**Fecha:** 19 abril 2026
**Tiempo total estimado:** ~3 horas y media de trabajo tuyo (repartible en varias sesiones)

Esta lista es lo que **solo tú** puedes hacer. Yo ya no puedo avanzar más sin estos pasos porque requieren tu email, tu tarjeta o tu identidad legal. Están ordenados por criticidad: haz el 1 → 2 → 3 → ... y para de golpe en cuanto te atasques.

> **Rebrand 2026-04-19 resuelto:** el nombre definitivo es **TripCazador** y el dominio objetivo es **tripcazador.com** (`tripcazador.es` está registrado por un tercero — verificado en Namecheap). Todo el código, branding y docs ya están rebrandeados.

---

## 🔴 CRÍTICO — sin esto el proyecto no sale

### 1. Comprar el dominio `tripcazador.com` — 10 min, 9,33€/año

Todo el código ya apunta a `tripcazador.com`. Sin el dominio no hay web.

**Recomendación (ya verificado hoy):**
- **Namecheap** — https://www.namecheap.com/domains/registration/results/?domain=tripcazador.com — **9,33€/año** el primer año con promo **NEWCOM679** (retail 12,73€/año). WHOIS privacy gratis incluido. Pago con tarjeta.

**Alternativas (si no quieres usar Namecheap):**
- **Porkbun** — https://porkbun.com — ~9$/año, buena UI, WHOIS privacy gratis.
- **Cloudflare Registrar** — at-cost (~8,57$/año .com), **sólo si ya tienes cuenta Cloudflare** (tú vas a tener una para DNS/CDN, así que podría ser una buena opción después).

Paga con tarjeta y activa WHOIS privacy. No configures DNS todavía — lo haremos en el paso 3 cuando tengas la IP de la VM.

**Entregable:** tener `tripcazador.com` a tu nombre.

---

### 2. Crear la VM gratuita en Oracle Cloud — 25 min

Es la alternativa gratuita a Hetzner que te propuse. 4 OCPU ARM + 24 GB RAM + 200 GB disco, **gratis para siempre**.

**Pasos:**
1. Ve a https://www.oracle.com/cloud/free/ → "Start for free".
2. Crea cuenta con tu email + número de teléfono + tarjeta (para verificación — **no cobran** nada si eliges Always Free).
3. En el wizard, **elige región: Frankfurt o Madrid** (latencia baja a tus usuarios ES/DACH). Esta decisión es permanente.
4. Tras crear la cuenta, menú → Compute → Instances → **Create Instance**:
   - Image: **Canonical Ubuntu 24.04** (aarch64 ARM)
   - Shape: **VM.Standard.A1.Flex** → 4 OCPUs, 24 GB RAM (es la tier Always Free)
   - Networking: deja el default VCN/subnet
   - SSH: pega tu clave pública (`~/.ssh/id_ed25519.pub`); si no tienes, genera con `ssh-keygen -t ed25519`
5. Espera 2 minutos → copia la **Public IP** de la instancia (ej. `158.101.x.x`).
6. En Networking → VCN → Security Lists → Ingress Rules: abre **puerto 80, 443 y 22** desde `0.0.0.0/0`.

**Entregable:** IP pública de la VM accesible por SSH (`ssh ubuntu@<IP>` debe funcionar).

---

### 3. Configurar el DNS del dominio apuntando a la VM — 5 min

En el panel de tu registrador (DonDominio/IONOS/etc.):

| Tipo | Nombre | Valor (IP de Oracle) | TTL |
|------|--------|----------------------|-----|
| A    | @      | 158.101.x.x          | 300 |
| A    | www    | 158.101.x.x          | 300 |
| A    | api    | 158.101.x.x          | 300 |

Propagación: 5-30 min. Verifica con `dig +short tripcazador.com`.

**Entregable:** los tres registros A resuelven a tu IP.

---

### 4. Crear bot de Telegram + canal — 15 min

Sin esto no hay alertas automáticas ni canal público.

**Pasos:**
1. Abre Telegram → busca `@BotFather` → `/newbot` → sigue las instrucciones → guarda el **TELEGRAM_BOT_TOKEN** (formato `1234:ABCDEF...`).
2. Crea un canal público en Telegram (New Channel), nombre "TripCazador", username `@tripcazador` (o el que prefieras).
3. Añade a tu bot como **administrador** del canal con permiso de publicar mensajes.
4. Obtén el chat_id: manda cualquier mensaje al canal, luego abre en tu navegador `https://api.telegram.org/bot<TU_TOKEN>/getUpdates` y busca `"chat":{"id":-100xxxxxxxxxx}`. Ese número (con el menos delante) es **TELEGRAM_CHAT_ID**.

**Entregable:** `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` guardados.

---

### 5. Registrarte en Travelpayouts y obtener el TP_MARKER — 10 min

**Qué es el TP_MARKER:** tu ID numérico de afiliado (ej. `123456`). Se añade a las URLs de reserva como `?marker=123456`, y cuando alguien reserva a través de uno de tus enlaces, **cobras comisión**. Sin este ID, los enlaces funcionan pero no cobras nada.

**Pasos:**
1. https://www.travelpayouts.com/ → Sign up (gratis).
2. Completa el perfil: nombre, país, método de pago (PayPal o SWIFT).
3. Panel → Tools → **Get your marker** (ID numérico, apúntalo).
4. Panel → Tools → **Get API token** para el motor de búsquedas (apúntalo como `TRAVELPAYOUTS_TOKEN`).

**Entregable:** `TP_MARKER` numérico + `TRAVELPAYOUTS_TOKEN`.

> Yo no puedo hacer esto por ti. Aunque habilites Chrome en Claude, no puedo completar el registro porque requiere verificación por email que llega a tu bandeja, y datos fiscales (IBAN/PayPal) personales.

---

### 6. Conseguir las API keys de búsqueda de vuelos — 30 min

Todas tienen **tier gratuito** suficiente para arrancar. Hazlo en este orden:

| API | URL | Tier free | Guardar como |
|-----|-----|-----------|--------------|
| Kiwi/Tequila | https://tequila.kiwi.com/portal/login | Ilimitado | `KIWI_API_KEY` |
| SerpAPI | https://serpapi.com | 100 búsquedas/mes | `SERPAPI_KEY` |
| RapidAPI Skyscanner | https://rapidapi.com/apiheya/api/sky-scrapper | 100 req/mes | `RAPIDAPI_KEY` |

**Importante:** Amadeus ya no acepta nuevos registros desde 2025. No lo intentes.

**Entregable:** 3 API keys guardadas.

---

### 7. Rellenar los datos fiscales en `/legal` — 5 min

La Ley de Servicios de la Sociedad de la Información (LSSI-CE) te obliga a identificarte en la web. Es **obligatorio** en España.

Abre `tripcazador-web/src/app/legal/page.tsx` y sustituye los `[PENDIENTE]`:

- **Titular:** tu nombre y apellidos (o razón social si lo haces como empresa).
- **NIF/CIF:** tu DNI (con la letra) o CIF de la empresa.
- **Domicilio:** dirección postal completa (se permite apartado de correos).
- **Email:** confirma `contacto@tripcazador.com` o cámbialo.

**Entregable:** archivo actualizado con tus datos reales.

> Si vas a operar como freelance en Alemania/Suiza en vez de España, dímelo y adapto la sección a LSDI alemana / LPD suiza.

---

## 🟡 IMPORTANTE — se puede aplazar, pero no mucho

### 8. Backblaze B2 para backups — 10 min

Gratis 10 GB. Hace los backups diarios de la BD a prueba de fallos.

**Pasos:**
1. https://www.backblaze.com/cloud-storage → Sign up.
2. Crea un **bucket** llamado `tripcazador-backups` (private, región EU-Central).
3. App Keys → Add a New Application Key → Scope: solo ese bucket → Guarda el `keyID` y `applicationKey`.

**Entregable:** `B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET=tripcazador-backups`.

---

### 9. Google Analytics 4 — 5 min

Para saber cuántas visitas tienes y de dónde.

**Pasos:**
1. https://analytics.google.com → Admin → Create property → "TripCazador" → Web.
2. Introduce URL `https://tripcazador.com` → obtén el **Measurement ID** (`G-XXXXXXXXXX`).

**Entregable:** `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`.

> El banner de cookies ya está implementado (RGPD). GA solo cargará si el usuario acepta.

---

### 10. Sentry (opcional pero muy recomendado) — 10 min

Te avisa si la web o la API pegan un error en producción.

**Pasos:**
1. https://sentry.io → Sign up free (5k eventos/mes gratis).
2. Create project → Next.js (para el frontend) → guarda `NEXT_PUBLIC_SENTRY_DSN`.
3. Create project → Python FastAPI (para el backend) → guarda `SENTRY_DSN`.

**Entregable:** dos DSNs.

---

## 🟢 DESPUÉS DEL LANZAMIENTO

### 11. Verificar la web en Google Search Console — 10 min

Para que Google indexe más rápido.

**Pasos:**
1. https://search.google.com/search-console → Add property → `https://tripcazador.com`.
2. Verificar por DNS TXT record (más estable) o archivo HTML.
3. Submit sitemap: `https://tripcazador.com/sitemap.xml`.

---

### 12. Crear perfiles sociales coherentes — 30 min

Para futuros backlinks + construir marca:

- Twitter/X: `@tripcazador`
- Instagram: `@tripcazador`
- Facebook Page: `tripcazador`
- Pinterest: `tripcazador` (muy fuerte para SEO de viajes)

Logo recomendado: la variante **HÍBRIDO** de `branding/` (archivo `trip_cazador_iso_hibrido_1024.png`).

---

## 📋 Checklist rápido — ponlos todos en `.env`

Cuando tengas todo lo anterior, copia `.env.example` a `.env` en el root del proyecto y rellena:

```bash
POSTGRES_PASSWORD=<algo-random-seguro>      # inventa tú
KIWI_API_KEY=<paso 6>
SERPAPI_KEY=<paso 6>
RAPIDAPI_KEY=<paso 6>
TRAVELPAYOUTS_TOKEN=<paso 5>
TP_MARKER=<paso 5>
TELEGRAM_BOT_TOKEN=<paso 4>
TELEGRAM_CHAT_ID=<paso 4>
NEXT_PUBLIC_GA_ID=<paso 9>                  # opcional
NEXT_PUBLIC_SENTRY_DSN=<paso 10>            # opcional
SENTRY_DSN=<paso 10>                        # opcional
B2_APPLICATION_KEY_ID=<paso 8>              # opcional
B2_APPLICATION_KEY=<paso 8>                 # opcional
B2_BUCKET=tripcazador-backups                # opcional
DOMAIN=tripcazador.com
API_DOMAIN=api.tripcazador.com
EMAIL_LETSENCRYPT=<tu-email>
```

---

## 🚀 Paso final (lo hago yo en tu nombre, pero necesito que tú ejecutes)

Cuando los pasos 1-7 estén hechos, dime y te doy un **único comando para copiar y pegar** en la VM Oracle que:

1. Clona el repo
2. Instala Docker, Caddy, UFW, fail2ban
3. Configura SSL automático con Let's Encrypt
4. Arranca el stack (API + worker + Postgres)
5. Activa watchdog cada 30 min (Telegram alerta si algo falla)
6. Activa backup diario a B2

Tiempo de ese paso: 20 min desatendido. En 30 min totales estás en producción con `https://tripcazador.com` funcionando.

---

## Resumen ejecutivo

**Lo que YA ESTÁ HECHO (yo):**

- Motor de búsqueda Python (8 técnicas de detección de anomalías, 6+ engines, notifier Telegram cableado)
- API FastAPI con endpoints `/api/deals`, `/api/stats`, `/api/health`, `/api/subscribe` (newsletter)
- Web Next.js 14 completa: home, deals, 12 destinos + 12 páginas detalle, blog con 5 artículos (11.5k palabras), legal RGPD, /telegram landing, /rss.xml
- SEO: sitemap dinámico, robots, JSON-LD (Organization + WebSite + Article + TouristDestination + BreadcrumbList), favicon pack, OG image
- Banner cookies RGPD con Google Consent Mode v2
- Marca: 3 variantes de logo (recomendada: híbrido), brand guide PDF 8 páginas
- Testing: pytest + Playwright E2E + CI GitHub Actions + watchdog + Sentry preparado
- Infra: `bootstrap.sh` one-shot para Oracle Cloud ARM, Caddyfile con SSL auto, backups diarios B2, systemd unit, restore script
- Migración SQLite→Postgres: script idempotente listo

**Lo que DEPENDE DE TI:**

Los 12 puntos de arriba, todos acciones que requieren tu email, tarjeta o datos personales que yo no puedo suplantar. Tiempo total ~3,5h repartido.

Cualquier pregunta sobre cómo hacer uno de los pasos, dime el número y te guío al detalle.
