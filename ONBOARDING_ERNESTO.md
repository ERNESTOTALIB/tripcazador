# TripCazador — Onboarding de Ernesto (los 6 pasos finales)

**Objetivo:** tener `https://tripcazador.com` sirviendo tráfico real, el canal de Telegram emitiendo alertas y el motor monetizando, todo en **~75 minutos reales** de tu tiempo.

Esta guía asume que la VM, el código y los secretos **NO existen todavía**. Ve en orden — cada paso depende del anterior.

> ⏱️ Tiempos: medidos en condiciones normales, sin bugs de los proveedores. El tiempo real puede variar ±30%.

---

## 📋 Resumen visual del flujo

```
1. Namecheap  →  2. Travelpayouts  →  3. Telegram bot  →  4. Oracle Cloud  →  5. DNS + deploy  →  6. Vercel
   10 min          5 min                5 min               30 min              15 min              10 min
```

Coste total primer año: **~10 €** (sólo el dominio). Todo lo demás es gratis.

---

## 1 · Comprar dominio `tripcazador.com` en Namecheap — 10 min

### Por qué Namecheap
- `.com` barato (~9,33 €/año con promo `NEWCOM679`).
- WhoisGuard gratis permanente (privacidad WHOIS, obligatorio post-RGPD).
- DNS básico decente mientras decides si usar Cloudflare.

### Pasos exactos
1. Abre **https://www.namecheap.com/domains/registration/results/?domain=tripcazador.com**.
2. Verifica que está disponible (en abril 2026 estaba libre; si no, fallback `trip-cazador.com` o `tripcazadores.com`).
3. Añádelo al carrito.
4. En el checkout, aplica el cupón `NEWCOM679` (si sigue activo; si no, busca "Namecheap promo code" en Google).
5. **NO** contrates los add-ons: WhoisGuard ya viene gratis, el resto (SSL, VPN, hosting) los cubrimos con Cloudflare+Caddy+Oracle.
6. Paga con tarjeta. Activa auto-renovación si no quieres perder el dominio (los error fares duran años).

### Qué recibes
- Acceso a `ap.www.namecheap.com/Domains/DomainControlPanel/tripcazador.com`.
- Dominio activo en 5-10 min tras el pago.

**Guarda en tu gestor de contraseñas:** `cuenta Namecheap` + `email + contraseña`.

---

## 2 · Crear cuenta Travelpayouts y obtener `TP_MARKER` — 5 min

### Por qué
Sin `TP_MARKER` no cobras comisión de afiliación — y el modelo de negocio se cae. Es 100% free tier, sin verificación de identidad estricta, pagos a partir de 50 €.

### Pasos exactos
1. Abre **https://www.travelpayouts.com/signup**.
2. Regístrate con tu email (`ernestalib@hotmail.com`) y crea contraseña.
3. Valida el email.
4. Panel → *My partners* → *All partners* → activa:
   - **Aviasales** (vuelos)
   - **Hotellook** (hoteles)
   - **Kiwi.com** (si aparece)
5. Panel → *Profile* → **Marker** → copia el número (formato: `123456`).
6. **Pégalo** en `/sessions/laughing-modest-bohr/mnt/Viajes/.env` como `TP_MARKER=123456`.
7. En el mismo panel, busca *API token* → crea uno → pégalo como `TRAVELPAYOUTS_TOKEN=...`.

### Verifica
```bash
grep -E "^(TP_MARKER|TRAVELPAYOUTS_TOKEN)=" /sessions/laughing-modest-bohr/mnt/Viajes/.env
```
Debe mostrar 2 líneas con valores no vacíos.

---

## 3 · Crear bot de Telegram + canal + obtener IDs — 5 min

### Por qué
Sin el bot, los deals `CRÍTICO` no se publican en tiempo real → perdemos el canal de distribución principal.

### Pasos exactos

**A. Crear el bot (BotFather):**
1. Abre Telegram en el móvil o en https://web.telegram.org/.
2. Busca `@BotFather`.
3. Envía `/newbot`.
4. Nombre visible: `TripCazador · Chollos de vuelo`
5. Username (único, debe acabar en `bot`): `tripcazador_bot` (si está cogido, prueba `tripcazador_radar_bot`).
6. BotFather te devuelve un `TELEGRAM_BOT_TOKEN` del estilo `7234567890:AAH...`. **Cópialo ya al .env** (no lo vuelven a mostrar).

**B. Crear el canal:**
1. Telegram → *Menú* → *Nuevo canal*.
2. Nombre: `TripCazador` · Descripción: `Alertas automáticas de error fares y chollos de vuelo desde Europa. Sin spam, sólo avisos con score ≥70.`
3. Canal **público** → `@tripcazador`.
4. Una vez creado → *Administradores* → añade el bot `@tripcazador_bot` como admin con permiso "Publicar mensajes".

**C. Obtener `TELEGRAM_CHAT_ID`:**
1. Publica cualquier mensaje de prueba en el canal.
2. En el navegador, abre:
   ```
   https://api.telegram.org/bot<TU_BOT_TOKEN>/getUpdates
   ```
   (Sustituye `<TU_BOT_TOKEN>` por el token real.)
3. Busca `"chat":{"id":-1002...,...}`. Ese número (con el signo menos) es tu `TELEGRAM_CHAT_ID`.
4. Pégalo al `.env` como `TELEGRAM_CHAT_ID=-1002xxxxxxxxxx`.

### Verifica
```bash
cd /sessions/laughing-modest-bohr/mnt/Viajes
python3 -c "
import os, requests
from dotenv import load_dotenv
load_dotenv()
r = requests.get(f'https://api.telegram.org/bot{os.environ[\"TELEGRAM_BOT_TOKEN\"]}/sendMessage',
                 params={'chat_id': os.environ['TELEGRAM_CHAT_ID'],
                         'text': '✅ TripCazador bot wired up.'})
print(r.status_code, r.json().get('ok'))
"
```
Si ves `200 True`, ya puedes publicar al canal desde el motor.

---

## 4 · Oracle Cloud Always Free + VM ARM Ubuntu 24.04 — 30 min

### Por qué
Always Free = 2 VPS ARM (24 GB RAM + 4 vCPU combinados) **sin caducidad**. Mejor precio que cualquier alternativa para un MVP.

### Pre-requisito
- Tarjeta de crédito (para verificación, **no cobran nada** en Always Free).
- Pasaporte o DNI para el KYC.

### Pasos exactos

**A. Registro (10 min):**
1. https://www.oracle.com/cloud/free/
2. Click *Start for free*.
3. Elige región **Frankfurt (eu-frankfurt-1)** o **Madrid (eu-madrid-1)** — latencia óptima para DACH/España.
4. Completa formulario → verificación SMS + tarjeta.
5. Oracle revisa la cuenta; en 5-15 min te llega el email "Your OCI account is ready".

**B. Crear VM ARM (15 min):**
1. Login → *Compute* → *Instances* → *Create instance*.
2. Nombre: `tripcazador-prod`.
3. Image: **Canonical Ubuntu 24.04** (arm64).
4. Shape: **VM.Standard.A1.Flex** → ajusta a **2 OCPU + 12 GB RAM** (todavía dentro del Always Free de 4/24).
5. Networking: crea una nueva VCN si no tienes. **Assign a public IPv4 address** → sí.
6. SSH keys: *Generate a key pair for me* → descarga la **private key** (`ssh-key-2026-xx-xx.key`) y guárdala en `~/.ssh/tripcazador.key`.
7. Boot volume: 50 GB (dentro del límite gratis).
8. *Create*. La VM tarda ~2 min.

**C. Configurar Security List (5 min):**
1. *Networking* → *Virtual Cloud Networks* → tu VCN → *Security Lists* → *Default Security List*.
2. Añade ingress rules:
   - TCP 22 (SSH) — source `0.0.0.0/0` *(recomendable restringir a tu IP de casa si es fija)*
   - TCP 80 (HTTP)  — source `0.0.0.0/0`
   - TCP 443 (HTTPS) — source `0.0.0.0/0`
   - UDP 443 (HTTP/3) — source `0.0.0.0/0`
3. **NO** abras 5432 ni 8000. Ya están bloqueados, doble seguridad.

**D. Bootstrap automático (10 min):**
```bash
chmod 600 ~/.ssh/tripcazador.key
PUBLIC_IP=$(oci compute instance list-vnics --instance-id <ocid> ... 2>/dev/null \
  || echo "CÓGELO DE LA CONSOLA DE ORACLE")

ssh -i ~/.ssh/tripcazador.key ubuntu@$PUBLIC_IP
# dentro de la VM:
curl -fsSL https://raw.githubusercontent.com/TU_USUARIO/tripcazador/main/infra/scripts/bootstrap.sh | bash
# (o scp del archivo si aún no está en GitHub)
```
El script instala Docker, Caddy, UFW, fail2ban, systemd unit, cron watchdog, cron backup. **No necesitas tocar nada a mano**.

### Verifica
```bash
ssh ubuntu@$PUBLIC_IP "docker ps && sudo systemctl status caddy --no-pager"
```
Deberías ver `caddy` activo y `tripcazador_db`, `tripcazador_api`, `tripcazador_worker` corriendo (aunque todavía sin tráfico web hasta el DNS).

---

## 5 · DNS Cloudflare + primer deploy — 15 min

### Por qué
Cloudflare = DNS rápido + CDN + WAF gratis + SSL automático (aunque Caddy también saca Let's Encrypt). Evita exponer la IP de la VM.

### Pasos exactos
1. https://dash.cloudflare.com/sign-up → registro gratis.
2. *Add a site* → `tripcazador.com` → plan **Free**.
3. Cloudflare escanea los DNS existentes de Namecheap (probablemente vacíos).
4. Añade manualmente:
   - `A` record: `@` → `<IP pública de la VM>` → proxy **activado (naranja)**.
   - `A` record: `www` → misma IP → proxy activado.
5. Cloudflare te da 2 nameservers, p.ej. `liz.ns.cloudflare.com` y `todd.ns.cloudflare.com`.
6. Ve a Namecheap → *Domain list* → `tripcazador.com` → *Manage* → *Nameservers* → **Custom DNS** → pega los dos de Cloudflare.
7. Guarda. Propagación: 5-30 min.

### Mientras propaga, rellena el resto del `.env` en la VM
```bash
ssh ubuntu@$PUBLIC_IP
cd /opt/tripcazador
cp .env.example .env
vim .env  # pega: KIWI_API_KEY, SERPAPI_KEY, RAPIDAPI_KEY, DUFFEL_TOKEN,
          # TRAVELPAYOUTS_TOKEN, TP_MARKER, TELEGRAM_*, POSTGRES_PASSWORD,
          # ADMIN_TOKEN (genera con `openssl rand -hex 32`),
          # IP_HASH_SALT (otro openssl rand -hex 16),
          # SENTRY_DSN (opcional), NEXT_PUBLIC_SITE_URL=https://tripcazador.com
```

### Activar prod completo
```bash
cd /opt/tripcazador
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
sudo systemctl reload caddy
```

### Verifica
```bash
curl -I https://tripcazador.com/api/health
```
Debes ver `HTTP/2 200`. Si no, `docker compose logs -f` para diagnosticar.

---

## 6 · Deploy Vercel (web Next.js) — 10 min

### Por qué
Vercel hobby plan = gratis, edge caching global, deploy automático desde GitHub. La web no necesita la VM de Oracle.

### Pasos exactos
1. Push el repo a GitHub (privado o público; si privado, conecta tu Vercel).
2. https://vercel.com/new → *Import Git Repository*.
3. Selecciona `tripcazador`.
4. Root directory: `tripcazador-web`.
5. Framework preset: **Next.js** (autodetectado).
6. Environment Variables:
   - `NEXT_PUBLIC_API_URL` = `https://tripcazador.com` (o `https://api.tripcazador.com` si decides separar)
   - `NEXT_PUBLIC_SITE_URL` = `https://tripcazador.com`
   - `NEXT_PUBLIC_GA_ID` = (cuando tengas GA4; opcional)
7. *Deploy*.
8. Tras el primer build, *Settings* → *Domains* → añade `tripcazador.com` y `www.tripcazador.com`.
9. Vercel te da un CNAME (`cname.vercel-dns.com`). Vuelve a Cloudflare y:
   - Cambia el `A` record `@` a un `CNAME @ cname.vercel-dns.com` con proxy **desactivado (gris)** (Vercel necesita ver la resolución directa para SSL).
   - O usa su setup recomendado de Flattened CNAME.
10. Reserva `/api/*` para la VM:
    - En Cloudflare → *Rules* → *Transform* → rewrite: si path empieza con `/api/`, reescribe el host destino a `<IP_VM>`.
    - O más simple: despliega la API en `api.tripcazador.com` (añade A record dedicado) y en `tripcazador-web/next.config.js` actualiza `NEXT_PUBLIC_API_URL`.

### Verifica
```bash
curl -I https://tripcazador.com
# → HTTP 200 con header `x-vercel-cache`
curl -I https://tripcazador.com/api/health
# → HTTP 200 con JSON {status: "ok", ...}
```

---

## 🎯 Checklist final

- [ ] Dominio activo y con Cloudflare nameservers
- [ ] `.env` en la VM con 9 variables rellenas
- [ ] `docker compose ps` muestra 3 contenedores healthy
- [ ] `curl https://tripcazador.com/api/health` devuelve 200
- [ ] `curl https://tripcazador.com` devuelve HTML de Vercel
- [ ] Primer mensaje de prueba en el canal de Telegram
- [ ] `python3 -c "from notifier import send; send('Test')"` desde la VM publica al canal
- [ ] UptimeRobot configurado apuntando a `https://tripcazador.com/api/health` (5 min)
- [ ] GitHub Actions CI verde

---

## 🆘 Troubleshooting rápido

| Síntoma | Causa probable | Fix |
|---|---|---|
| `curl tripcazador.com` → timeout | DNS no propagó aún | Espera 10 min más + `dig tripcazador.com` |
| `/api/health` → 502 | Caddy no alcanza API | `docker compose logs api` + verificar `127.0.0.1:8000` escucha |
| Telegram bot no publica | `TELEGRAM_CHAT_ID` sin signo `-` | Prefija con `-100...` |
| CSP rompe GA4 | Falta `https://www.googletagmanager.com` | Ya está en `next.config.js`, redespliega |
| Vercel build falla `sharp` | Tamaño imagen | Reemplaza PNG grande o añade `images.unoptimized: true` |

---

## 🔐 Post-launch security checklist (hazlo el mismo día del deploy)

```bash
# En la VM:
sudo bash /opt/tripcazador/infra/ufw/setup-ufw.sh
sudo cp /opt/tripcazador/infra/fail2ban/jail.local /etc/fail2ban/jail.d/tripcazador.conf
sudo cp /opt/tripcazador/infra/fail2ban/filter.d/* /etc/fail2ban/filter.d/
sudo systemctl reload fail2ban
sudo cp /opt/tripcazador/infra/logrotate/tripcazador /etc/logrotate.d/tripcazador
sudo logrotate -d /etc/logrotate.d/tripcazador  # dry-run de verificación

# Rota secretos cada 30 días:
bash /opt/tripcazador/infra/scripts/rotate_admin_token.sh
```

---

## 📧 Después del deploy

1. **Search Console:** añade `tripcazador.com` → verifica con DNS TXT → sube sitemap `https://tripcazador.com/sitemap.xml`.
2. **Google Analytics 4:** opcional, crea property → copia `G-XXXXXXXXXX` a `NEXT_PUBLIC_GA_ID` en Vercel → redeploy.
3. **Sentry:** crea proyectos separados para frontend (Next.js) y backend (FastAPI) → copia los 2 DSN al entorno → Sentry empieza a capturar errores.
4. **Redes sociales:** aparta `@tripcazador` en IG, Twitter/X, TikTok (no tienen que estar activas todavía, pero reservar username evita squatting).
5. **Backblaze B2:** crea bucket `tripcazador-backups` → copia las keys a la VM → el cron diario de backup empieza a subir.

Tiempo total post-launch: 20 min más. Ya quedan sólo 1h 35 min totales desde cero.

---

**Cualquier paso que falle, vuelve al repo y ejecuta:**
```bash
grep -r "CUSTOM_ERROR_STRING" /sessions/laughing-modest-bohr/mnt/Viajes/STATUS.md
```
para ver si ya está documentado. Si no, abre issue en GitHub con el log completo.

**Última actualización:** 2026-04-19 (sesión 6 de Claude).
