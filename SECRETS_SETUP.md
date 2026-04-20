# Bootstrap final de CI/CD — 1 comando desde Cloud Shell

> Después de los últimos commits, **toda la configuración restante cabe en un
> único comando**. El script lee el `.env` de tu VM, genera una SSH key dedicada,
> la instala en la VM, sube todos los secrets al repo vía la API de GitHub,
> redepliega el API y dispara el Worker como smoke test.

---

## 🚀 Ejecuta esto en [Cloud Shell](https://console.cloud.google.com/cloudshell)

```bash
curl -fsSL https://raw.githubusercontent.com/ERNESTOTALIB/tripcazador/main/scripts/bootstrap_github_ci.sh \
  -o /tmp/bootstrap_github_ci.sh && bash /tmp/bootstrap_github_ci.sh
```

El script te pedirá:

1. **Un PAT de GitHub** con scope `repo` y `workflow` (no lo guarda; solo lo usa para la API).
   Generar nuevo en → https://github.com/settings/tokens/new
2. **Un VERCEL_TOKEN** (o dejar vacío si ya tienes uno configurado).
   Generar nuevo en → https://vercel.com/account/settings/tokens

Una vez ambos pegados, el script hace TODO lo demás automáticamente
(~2 minutos de ejecución).

---

## ✅ Secrets que ya están en el repo

Añadidos automáticamente en este commit:

- `VERCEL_ORG_ID` → `team_yGePQTjnzSAWEPzPG73xGlFE`
- `VERCEL_PROJECT_ID` → `prj_67nltvSOptrl1ZlfEWjQeAQrLLQu`

---

## 📋 Secrets que el script rellena por ti

Leídos del `.env` de la VM (`/opt/tripcazador/.env`):

| Secret | Origen |
|---|---|
| `KIWI_API_KEY` | `.env` VM |
| `SERPAPI_KEY` | `.env` VM |
| `RAPIDAPI_KEY` | `.env` VM |
| `TRAVELPAYOUTS_TOKEN` | `.env` VM |
| `TP_MARKER` | `.env` VM |
| `DUFFEL_TOKEN` | `.env` VM |
| `ADMIN_TOKEN` | `.env` VM (se genera si no existe) |
| `TELEGRAM_BOT_TOKEN` | `.env` VM |
| `TELEGRAM_CHAT_ID` | `.env` VM |

Generados/detectados por el script:

| Secret | Origen |
|---|---|
| `SSH_PRIVATE_KEY` | genera `~/.ssh/tripcazador_deploy` y la pubkey se instala en la VM |
| `VPS_HOST` | IP pública de la VM vía `gcloud compute instances describe` |
| `VPS_USER` | `$USER` de Cloud Shell |

Pedidos interactivamente (solo 1):

| Secret | Origen |
|---|---|
| `VERCEL_TOKEN` | https://vercel.com/account/settings/tokens |

---

## 🧹 Única acción manual que queda

Revocar el PAT viejo `tripcazador-deploy`:
https://github.com/settings/tokens → **Delete**

Una vez hecho, el proyecto corre solo:

- 🔁 Worker cada 6 h → `deals.json` fresco en prod
- 🟢 Push a `tripcazador-web/**` → Vercel despliega sin tocar tokens
- 🟢 Push a `api/**` o `flight_hunter_v4/**` → VM se actualiza por SSH
