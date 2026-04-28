# Configurar emails @tripcazador.com → ernestalib@hotmail.com

**Tiempo estimado:** 5 minutos · **Coste:** GRATIS · **Servicio:** Cloudflare Email Routing

Como `tripcazador.com` ya está apuntando a Cloudflare (lo configuramos en fase de DNS),
podemos usar **Cloudflare Email Routing** para reenviar TODO el correo del dominio a tu Hotmail.
No requiere cambiar MX records manualmente — Cloudflare los inyecta automáticamente.

---

## Pasos exactos

### 1. Abrir Email Routing en Cloudflare

1. Entra en https://dash.cloudflare.com
2. Selecciona la cuenta de **tripcazador.com**
3. En la barra izquierda → **Email** → **Email Routing**
4. Si es la primera vez, pulsa **"Get started"**

### 2. Aceptar la configuración automática de DNS

Cloudflare propondrá añadir 3 registros MX y 1 TXT (SPF). Pulsa **"Add records and enable"**:

```
MX  @  10  route1.mx.cloudflare.net
MX  @  74  route2.mx.cloudflare.net
MX  @  93  route3.mx.cloudflare.net
TXT @     "v=spf1 include:_spf.mx.cloudflare.net ~all"
```

> ⚠️ Si ya tenías un MX o SPF (de Google Workspace, Zoho, etc.), Cloudflare avisa.
> Como no tienes nada configurado, simplemente acepta.

### 3. Verificar tu dirección de destino (Hotmail)

1. En **Destination addresses** → **Add destination address**
2. Introduce: `ernestalib@hotmail.com`
3. Cloudflare envía un email de verificación → abre tu Hotmail (revisa también **Spam/Otros**) y pulsa el enlace.
4. Aparece como ✅ **Verified**.

### 4. Crear las reglas de reenvío (catch-all + específicas)

En **Custom addresses** pulsa **"Create address"**. Crea estas 5 reglas:

| Custom address                  | Action  | Destination                   |
|--------------------------------|---------|-------------------------------|
| `contacto@tripcazador.com`     | Send to | `ernestalib@hotmail.com`      |
| `legal@tripcazador.com`        | Send to | `ernestalib@hotmail.com`      |
| `privacidad@tripcazador.com`   | Send to | `ernestalib@hotmail.com`      |
| `partners@tripcazador.com`     | Send to | `ernestalib@hotmail.com`      |
| `prensa@tripcazador.com`       | Send to | `ernestalib@hotmail.com`      |

**Bonus (recomendado):** activa **Catch-all address** al final de la página y apunta también
a `ernestalib@hotmail.com`. Así, cualquier email a `loquesea@tripcazador.com` (ej. `info@`,
`hola@`, `soporte@`, futuros aliases) llegará a tu Hotmail sin tener que configurarlo a mano.

### 5. Probar

Desde tu Hotmail (o desde `mailto:contacto@tripcazador.com` haciendo clic en el footer
de la web en producción), envía un email de prueba a `contacto@tripcazador.com`.

Debería llegar a `ernestalib@hotmail.com` en menos de 30 segundos.

---

## Notas técnicas

- **Cloudflare Email Routing** es gratuito ilimitado para reenvíos entrantes.
- **NO incluye envío saliente.** Si quieres responder *desde* `contacto@tripcazador.com`
  necesitas un proveedor SMTP separado (Resend free tier: 3000 emails/mes —
  ya tenemos `RESEND_API_KEY` en `/api/notify-alert`).
- El código de la web ya tiene unificados todos los `mailto:` apuntando a
  `contacto@tripcazador.com` (fase ll), así que no hay que tocar el código.
- Headers DKIM/DMARC opcionales (Cloudflare los añade más adelante si quieres firmar emails;
  para reenvío básico no son necesarios).

## Si algo falla

- Email de verificación no llega → revisa spam/junk en Hotmail. Si tampoco está, comprueba
  que `ernestalib@hotmail.com` esté escrito sin typos en Cloudflare.
- Email a `contacto@` rebota → pulsa **"Verify configuration"** en la cabecera de Email
  Routing. Cloudflare comprueba que los MX están propagados (suele tardar <5 min).
- Quieres añadir otra dirección destino (ej. socio del proyecto) → mismo flujo en
  **Destination addresses** y luego edita la regla.
