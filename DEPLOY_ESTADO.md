# TripCazador — Estado del Deploy

> Actualizado 2026-04-19 · ejecutado autónomamente por Claude desde GCP Cloud Shell

## ✅ EN PRODUCCIÓN AHORA MISMO

Abre ahora: **https://tripcazador.com** → landing lista, SSL Let's Encrypt activo.

Comprobaciones operativas:

```
$ curl -sI https://tripcazador.com | head -3
HTTP/2 200
date: Sun, 19 Apr 2026 20:34:05 GMT
content-type: text/html; charset=utf-8

$ curl -s https://api.tripcazador.com/health
{"status":"ok","service":"tripcazador-api","version":"0.1.0-placeholder"}
```

## Qué se ha hecho autónomamente

| Acción | Herramienta |
| --- | --- |
| SSH a `tripcazador-vm` (us-central1-f, Ubuntu 22.04.5) | GCP Cloud Shell `gcloud compute ssh` |
| Instalar `docker.io`, `ufw`, `curl`, `jq` | apt-get |
| Crear `/opt/tripcazador/{web,caddy_data,caddy_config}` | SSH heredoc |
| Escribir `index.html` (landing con hero airplane, CTA Telegram) | heredoc |
| Escribir `Caddyfile` (reverse proxy + TLS auto + headers de seguridad) | heredoc |
| Abrir puertos 22/80/443 en UFW | ufw allow |
| Lanzar container `tripcazador-caddy` con imagen `caddy:2.8-alpine` | docker run -d --restart unless-stopped |
| Obtener certificados Let's Encrypt para `tripcazador.com`, `www.tripcazador.com`, `api.tripcazador.com` | Caddy ACME |
| Verificar con curl desde Cloud Shell | - |

Todo el deploy está en un script reproducible en la VM en `/tmp/deploy.sh` (copiable a
/opt/tripcazador/ para futura referencia).

## Lo que queda (y por qué no lo pude hacer solo)

### 1. Promover @tripcazador_bot como admin del canal (1 min, móvil)
**Bloqueo técnico real**: Telegram Web (tanto K como A) deliberadamente NO expone la
opción "Añadir al canal" para bots. El deep-link `tg://resolve?domain=...&startchannel=true`
tampoco activa ningún diálogo en Web. La única forma es la app móvil/desktop.

Pasos en tu iPhone/Android:
1. Abre el canal `TripCazador — Chollos de vuelo`
2. Nombre del canal → `Administradores` → `Añadir Administrador`
3. Busca `tripcazador_bot`, marca "Publicar mensajes", confirma

Cuando esté hecho, yo lanzo un mensaje de prueba al canal y cambio
`TELEGRAM_CHAT_ID=-1003940460384` en `.env`.

### 2. Push del repo a GitHub (5 min, navegador)
**Bloqueo técnico**: Cloud Shell no tiene credenciales GitHub cacheadas. Necesito que tú
hagas en Cloud Shell (la terminal que está abierta en la consola GCP):

```
gh auth login --web
```

Te dará un código de 8 caracteres para pegar en github.com/login/device. Una vez hecho,
yo hago el resto (`gh repo create --private`, `git push`).

Si prefieres, puedes generar un PAT en https://github.com/settings/tokens (scope `repo`)
y pegármelo aquí — también sirve.

### 3. Sustituir landing HTML por app completa (cuando quieras)
La landing actual es un HTML autocontenido que saqué para que el dominio no estuviera vacío.
En cuanto el repo esté en GitHub, clono en la VM y arranco la stack Next.js + FastAPI +
Postgres + worker con `docker compose -f docker-compose.prod.yml up -d`.

## Archivos y recursos

- **Servidor**: `tripcazador-vm` en us-central1-f, IP estática `136.115.63.164`
- **Container activo**: `tripcazador-caddy` (Caddy 2.8-alpine)
- **Ruta en VM**: `/opt/tripcazador/`
- **Certificados**: en `caddy_data` (renovación automática por Caddy)
- **Firewall**: UFW con 22/80/443 abiertos, resto cerrado
- **DNS**: Cloudflare orchestra, A records `@` y `api` → `136.115.63.164`
- **Bot Telegram**: `@tripcazador_bot` (token en `.env` local)
- **Chat DM**: `707986612` (recibe alertas)
