# TripCazador — Despliegue final (15 minutos)

> Todo lo que Claude ha podido automatizar ya está hecho. Quedan 3 pasos manuales
> que requieren tu consola (SSH-in-browser) o tu móvil. Sigue este orden.

## ✅ Estado actual (completado automáticamente)

| Recurso | Valor |
| --- | --- |
| Dominio | `tripcazador.com` (Namecheap, nameservers → Cloudflare) |
| Cloudflare | A records: `@` y `api` → `136.115.63.164` |
| GCP VM | `tripcazador-vm` en `us-central1-f` (e2-micro Always Free) |
| GCP IP estática | `tripcazador-static-ip` = `136.115.63.164` (reservada) |
| Telegram Bot | `@tripcazador_bot` (token en `.env`) |
| Telegram Chat DM | `707986612` (Ernesto, funcional — mensaje de prueba enviado) |
| Travelpayouts | `TP_MARKER=513030` (en `.env`) |
| Duffel / SerpAPI / RapidAPI | Tokens en `.env` |
| Código (motor + web + tests 251/251) | 100% en el repo local |

## ⏳ 3 pasos manuales restantes

### Paso 1 — Subir el repo a GitHub (5 min)

```bash
cd /sessions/laughing-modest-bohr/mnt/Viajes
gh repo create tripcazador/tripcazador --private --source=. --remote=origin --push
# o si prefieres sin CLI de gh:
# git init && git add . && git commit -m "Initial" && git remote add origin git@github.com:tu-usuario/tripcazador.git && git push -u origin main
```

Luego añade los GitHub Secrets (Settings → Secrets and variables → Actions):
`SSH_HOST=136.115.63.164`, `SSH_USER=ubuntu`, `SSH_PRIVATE_KEY=…`, `ENV_FILE=…`

### Paso 2 — Desplegar en la VM (8 min)

Abre **SSH-in-browser** sobre `tripcazador-vm` desde la consola GCP
(botón `SSH` en la fila de la VM). Una vez dentro:

```bash
# descargar bootstrap y correr
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/tripcazador/tripcazador/main/infra/scripts/bootstrap.sh)"

# subir tu .env (desde tu máquina local, en otra terminal):
gcloud compute scp /sessions/laughing-modest-bohr/mnt/Viajes/.env \
  ubuntu@tripcazador-vm:/opt/tripcazador/.env \
  --zone=us-central1-f

# volver a SSH y arrancar:
sudo systemctl start tripcazador
sudo systemctl status tripcazador

# verificar
curl https://tripcazador.com
curl https://api.tripcazador.com/health
```

El bootstrap instala Docker, Caddy (SSL auto), UFW, fail2ban, watchdog cron y
el unit systemd `tripcazador.service` que orquesta `docker-compose.prod.yml`.

### Paso 3 — Promover el bot a admin del canal Telegram (1 min)

Telegram Web **no expone** la opción "Add to Channel" para bots. Desde tu móvil
o la app de desktop:

1. Abre el canal `TripCazador — Chollos de vuelo`.
2. Toca el nombre → `Administrators` → `Add Admin`.
3. Busca `@tripcazador_bot` y concédele permiso "Post messages".

Después comprueba el chat_id del canal:
```bash
curl "https://api.telegram.org/bot8734221853:AAGNyAdyNSOWbnKHSI_7uHgaQa6Xj3B8HXs/sendMessage" \
  -d "chat_id=-1003940460384" -d "text=Bot operativo en el canal ✅"
```

Si responde `"ok":true`, cambia en `/opt/tripcazador/.env` de la VM:
```
TELEGRAM_CHAT_ID=-1003940460384    # antes 707986612
```
y `sudo systemctl restart tripcazador`.

## ⏳ Pendiente no urgente

- **Kiwi/Tequila API**: regístrate en tequila.kiwi.com (tier gratis 100 req/día),
  pega la key en `/opt/tripcazador/.env` como `KIWI_API_KEY=…`, reinicia servicio.
- **Vercel**: importa `tripcazador-web/`, conecta dominio `tripcazador.com`
  (Cloudflare ya apunta allí — solo mueve el A record de `@` de la VM al CNAME de Vercel
  cuando quieras el frontend desacoplado del backend).

## Checklist final tras desplegar

- [ ] `https://tripcazador.com` devuelve landing
- [ ] `https://api.tripcazador.com/health` devuelve `{"status":"ok"}`
- [ ] `systemctl status tripcazador` → `active (running)`
- [ ] `docker ps` muestra 3 contenedores: `tripcazador-api`, `tripcazador-worker`, `tripcazador-db`
- [ ] Bot envía un chollo de prueba al DM al cabo de <6h (cron worker)
