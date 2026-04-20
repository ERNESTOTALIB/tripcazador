# GitHub Actions — Secrets a configurar

> Añadir en **https://github.com/ERNESTOTALIB/tripcazador/settings/secrets/actions**
> → botón **New repository secret** (uno por uno).

Sin estos secrets los tres workflows (`deploy-api`, `vercel-deploy`, `worker`) fallarán.
Una vez configurados, todo se despliega automáticamente sin intervención manual.

---

## 1️⃣ Auto-deploy Vercel (workflow: `vercel-deploy.yml`)

Reemplaza la rotación manual del token cada vez que caduca. Se dispara en
cualquier push a `main` que toque `tripcazador-web/**`.

| Secret | Valor | Cómo obtener |
|---|---|---|
| `VERCEL_TOKEN` | _(generar nuevo)_ | https://vercel.com/account/settings/tokens → **Create** → scope: Full account |
| `VERCEL_ORG_ID` | `team_yGePQTjnzSAWEPzPG73xGlFE` | Ya conocido |
| `VERCEL_PROJECT_ID` | `prj_67nltvSOptrl1ZlfEWjQeAQrLLQu` | Ya conocido |

⚠️ **IMPORTANTE:** Una vez añadido `VERCEL_TOKEN` al repo, **revoca el PAT viejo**
(`ghp_…`) desde https://github.com/settings/tokens (ya no hace falta — todos los
deploys se disparan por push).

---

## 2️⃣ Worker gratuito (workflow: `worker.yml`)

Corre cada 6h en runners de GitHub (gratis hasta 2000 min/mes en repos privados),
genera `deals.json` y lo sube al API vía `POST /api/admin/deals`.

**API keys del Flight Hunter** — copiar de `~/.env` o del archivo local donde las
guardaste:

| Secret | Dónde está |
|---|---|
| `KIWI_API_KEY` | Kiwi / Tequila |
| `SERPAPI_KEY` | SerpAPI (Google Flights) |
| `RAPIDAPI_KEY` | RapidAPI (Booking/Skyscanner) |
| `TRAVELPAYOUTS_TOKEN` | Travelpayouts |
| `TP_MARKER` | Travelpayouts marker |
| `DUFFEL_TOKEN` | Duffel |

**Auth al API:**

| Secret | Valor |
|---|---|
| `ADMIN_TOKEN` | El mismo valor que `ADMIN_TOKEN` en `/opt/tripcazador/.env` de la VM |

Para ver el token actual en la VM:
```bash
gcloud compute ssh tripcazador-vm --zone=europe-southwest1-a \
  --command="sudo grep ADMIN_TOKEN /opt/tripcazador/.env"
```

Si no existe aún, generar uno:
```bash
openssl rand -hex 32
```
…y añadirlo tanto al `.env` de la VM como al secret de GitHub.

---

## 3️⃣ Redeploy automático del API (workflow: `deploy-api.yml`)

Ya existe el workflow; solo necesita estos secrets para disparar `git pull + docker-compose up`
por SSH cada vez que cambian `api/**` o `flight_hunter_v4/**`:

| Secret | Valor |
|---|---|
| `SSH_PRIVATE_KEY` | Clave privada SSH (la que usas para `gcloud compute ssh`, en formato PEM) |
| `VPS_HOST` | IP pública de la VM (p.ej. `34.175.xxx.yyy`) |
| `VPS_USER` | Usuario SSH (normalmente `ernestalib` o el que uses con gcloud) |

Para generar una clave dedicada al deploy (recomendado, no reutilices tu clave personal):

```bash
ssh-keygen -t ed25519 -C "github-actions@tripcazador" -f ~/.ssh/tripcazador_deploy -N ""
# Copia la pública a la VM:
gcloud compute ssh tripcazador-vm --zone=europe-southwest1-a \
  --command="echo '$(cat ~/.ssh/tripcazador_deploy.pub)' >> ~/.ssh/authorized_keys"
# Pega el contenido de ~/.ssh/tripcazador_deploy (privada) en el secret SSH_PRIVATE_KEY
```

**Alternativa rápida si no quieres configurar SSH:** redeploy manual una única vez:
```bash
gcloud compute ssh tripcazador-vm --zone=europe-southwest1-a --command="cd /opt/tripcazador && git pull && docker-compose up -d --build api && sudo systemctl restart tripcazador"
```
…y a partir de ahí, los siguientes pushes actualizarán el API vía `deploy-api.yml`
(si hay secrets) o seguirán requiriendo el comando manual (si no los hay).

---

## 4️⃣ Telegram (opcional — compartido entre todos los workflows)

| Secret | Valor |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Token del bot (de @BotFather) |
| `TELEGRAM_CHAT_ID` | Tu chat ID |

Si no los configuras, los workflows funcionan igual — solo se saltan el paso de
notificación al final.

---

## ✅ Checklist final

Tras añadir los secrets:

1. `git push` → dispara `deploy-api.yml` (API se redeploya en la VM con `/api/admin/deals`)
2. Actualizar `tripcazador-web/` → dispara `vercel-deploy.yml` (frontend desplegado sin tocar tokens)
3. Ir a **Actions → Worker → Run workflow** para probar el hunter antes del primer cron de las 00:00 UTC
4. Revocar el PAT viejo: https://github.com/settings/tokens

Una vez todo esto esté hecho, el proyecto corre solo:
- Worker cada 6h → `deals.json` fresco en el API
- Cualquier cambio en `tripcazador-web/` → Vercel lo publica
- Cualquier cambio en `api/` o `flight_hunter_v4/` → VM se actualiza
