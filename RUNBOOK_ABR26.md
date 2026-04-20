# Runbook abril 2026 — cerrar los 3 pendientes

Tres tareas que requieren credenciales que no puedo tocar desde el agente.
Copia-pega estos pasos en tu terminal/navegador.

---

## 1) Configurar `NEXT_PUBLIC_API_URL` en Vercel (5 min)

Sin esta variable, el frontend de producción llama a `http://localhost:8000`
y ves deals vacíos. Esto se descubrió en la auditoría del 2026-04-20
(ver `project_tripcazador_audit_apr26.md`).

### A) Vía web (más simple)

1. Abre https://vercel.com/ernestotalib/tripcazador/settings/environment-variables
2. Click **Add New**
3. Rellena:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://api.tripcazador.com` (o la URL real de tu API en Fly.io)
   - Environments: **Production**, **Preview**, **Development** (los 3)
4. Save
5. Dispara un redeploy: **Deployments → latest → ⋯ → Redeploy**

### B) Vía CLI (si ya tienes `vercel` instalado)

```bash
cd tripcazador-web
vercel env add NEXT_PUBLIC_API_URL production
# Cuando pregunte value: https://api.tripcazador.com
# Repite para preview y development
vercel env add NEXT_PUBLIC_API_URL preview
vercel env add NEXT_PUBLIC_API_URL development

# Redeploy
vercel --prod
```

---

## 2) Configurar secretos en Fly.io para price-alerts SMTP (10 min)

El endpoint `/api/admin/match-price-alerts` no envía emails reales hasta que
se definen las 3 variables SMTP + el ADMIN_TOKEN. Mientras tanto, el worker
en GitHub Actions lo llama y recibe `skipped_dedupe=0, sent=0` — no rompe,
pero tampoco notifica.

### Token admin ya generado para ti

```
ADMIN_TOKEN = bK1KS8xV8VvE6A756izDUuddOnXctmjiEXrM-NxFhv8
```

> Este token se usa con HMAC (`hmac.compare_digest`) en el endpoint. No lo
> publiques — guárdalo sólo en Fly.io secrets y en GitHub Actions secrets.

### Comandos (copia-pega en tu terminal)

Requiere tener `flyctl` instalado y `fly auth login` hecho previamente.

```bash
cd /ruta/a/tripcazador

# 1) Secret del token admin (el mismo valor en Fly y en GitHub)
fly secrets set ADMIN_TOKEN='bK1KS8xV8VvE6A756izDUuddOnXctmjiEXrM-NxFhv8' --app tripcazador-api

# 2) SMTP — si usas Resend (recomendado, gratis hasta 3k/mes)
fly secrets set \
  SMTP_HOST='smtp.resend.com' \
  SMTP_PORT='465' \
  SMTP_USER='resend' \
  SMTP_PASSWORD='re_TU_API_KEY_DE_RESEND' \
  RESEND_FROM_EMAIL='alertas@tripcazador.com' \
  --app tripcazador-api

# 3) Verifica que quedaron bien (solo muestra nombres, no valores):
fly secrets list --app tripcazador-api
```

### El mismo ADMIN_TOKEN en GitHub Actions (para el worker cron)

```bash
# Requiere `gh auth login` previamente
echo -n 'bK1KS8xV8VvE6A756izDUuddOnXctmjiEXrM-NxFhv8' \
  | gh secret set ADMIN_TOKEN --repo ERNESTOTALIB/tripcazador
```

### Crear API key de Resend (si no tienes)

1. Abre https://resend.com/api-keys
2. **Create API Key** → nombre: `tripcazador-prod`, permiso: `Sending access`
3. Copia la clave (empieza por `re_`) y úsala en el comando `SMTP_PASSWORD`
   de arriba

### Smoke test

Tras setear los secretos, fuerza un deploy:

```bash
fly deploy --app tripcazador-api
```

Y llama al matcher manualmente:

```bash
curl -X POST https://api.tripcazador.com/api/admin/match-price-alerts \
  -H "X-Admin-Token: bK1KS8xV8VvE6A756izDUuddOnXctmjiEXrM-NxFhv8"
```

Debes recibir JSON con `{ "status": "ok", "sent": N, ... }`.

---

## 3) Verificar el worker cron (3 min)

El worker se ejecuta cada 6h. Para forzarlo manualmente:

1. Abre https://github.com/ERNESTOTALIB/tripcazador/actions/workflows/worker.yml
2. Click **Run workflow** → main → **Run workflow**
3. Espera ~5 min
4. Verifica:

```bash
curl https://api.tripcazador.com/api/health
# Debe mostrar deals_exists:true y last_update reciente
```

Si `deals_exists:false`, revisa logs del run: probablemente faltan
`RAPIDAPI_KEY` o `ADMIN_TOKEN` como secrets del repo.

---

_Generado: 2026-04-20_
