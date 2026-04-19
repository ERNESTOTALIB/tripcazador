# Oracle Cloud ARM — Deploy TripCazador (gratuito, para siempre)

Guía completa de provisión + despliegue en Oracle Cloud Infrastructure (OCI) usando la tier **Always Free** con 4 OCPUs Ampere A1 (ARM) + 24 GB RAM + 200 GB block storage. Sin tarjeta de crédito de pago, solo verificación inicial.

## 1. Crear la instancia

1. Sign up en https://www.oracle.com/cloud/free/ (requiere tarjeta para verificar, no cobra).
2. Home region: elegir **Frankfurt** o **Madrid** (latencia baja desde usuarios ES/DACH).
3. Compute → Instances → Create instance:
   - **Image:** Canonical Ubuntu 24.04 (aarch64)
   - **Shape:** VM.Standard.A1.Flex → 4 OCPUs, 24 GB RAM (Always Free)
   - **Networking:** default VCN + public subnet
   - **SSH keys:** pegar tu clave pública (`~/.ssh/id_ed25519.pub`)
4. Tras la creación: copia la IP pública (ej. `158.101.x.x`).
5. En Networking → VCN → Security Lists → Ingress: abre **80** (TCP), **443** (TCP) y **22** (TCP) desde `0.0.0.0/0`.

## 2. DNS

En tu registrador del dominio `tripcazador.com`:

| Tipo | Nombre | Valor            | TTL |
|------|--------|------------------|-----|
| A    | @      | IP de la VM      | 300 |
| A    | www    | IP de la VM      | 300 |
| A    | api    | IP de la VM      | 300 |

## 3. Bootstrap de la VM

Desde tu máquina local:

```bash
ssh ubuntu@<IP>
```

Dentro de la VM, ejecutar:

```bash
curl -sSL https://raw.githubusercontent.com/<tu-user>/tripcazador/main/infra/scripts/bootstrap.sh | bash
```

O manualmente clonar el repo y lanzar `./infra/scripts/bootstrap.sh`.

## 4. Variables de entorno

Copia `.env.example` a `/opt/tripcazador/.env` y rellena:

- `POSTGRES_PASSWORD`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `RAPIDAPI_KEY`
- `TRAVELPAYOUTS_TOKEN`, `TP_MARKER`
- `SENTRY_DSN` (opcional)
- `NEXT_PUBLIC_GA_ID` (opcional)

## 5. Despliegue

```bash
sudo systemctl start tripcazador
sudo systemctl enable tripcazador
```

## 6. Verificación

```bash
sudo systemctl status tripcazador
curl https://tripcazador.com
curl https://api.tripcazador.com/health
```

El watchdog comprueba salud cada 30 min y envía alerta a Telegram si algo falla.

## 7. Backups

Automático cada día a las 04:00 UTC → Backblaze B2 (10 GB gratis). Ver `backup.sh`.
