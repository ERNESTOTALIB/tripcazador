# WhatsApp Business setup — TripCazador

> SSS83 May 2026 — guía de activación para alertas premium €0.99/mes vía WhatsApp.

## 1. Crear cuenta WhatsApp Business API

Hay 2 caminos:

**A. Meta directo** (gratis hasta 1.000 conversaciones/mes service initiated)
1. Ve a https://business.facebook.com → "Crear cuenta empresa" si no tienes
2. Settings → "Cuentas de WhatsApp" → "Añadir cuenta WhatsApp Business"
3. Conecta tu número (puedes usar el mismo de Telegram bot)
4. Verifica vía SMS o llamada
5. En "App settings" anota `WHATSAPP_PHONE_NUMBER_ID` y genera `WHATSAPP_ACCESS_TOKEN` (system user, never expire)

**B. Vía Twilio** (más sencillo, 0.005$/msg)
1. https://console.twilio.com → Messaging → Try WhatsApp
2. Activa sandbox para testing → en producción "Apply for production access" (3-5 días)
3. `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` (formato `whatsapp:+14155238886`)

## 2. Templates aprobados (Meta requiere pre-aprobar mensajes proactivos)

Crea estos en `business.facebook.com → Message Templates`:

```
Nombre: deal_alert_es
Categoría: UTILITY
Idioma: es
Body:
  ✈️ ¡Chollo encontrado!
  {{1}} → {{2}} desde {{3}}€ ({{4}})
  Reserva ya: {{5}}
Variables:
  1=city_from, 2=city_to, 3=price, 4=date, 5=booking_url
```

```
Nombre: weekly_digest_es
Categoría: MARKETING
Body:
  📰 Tu resumen semanal TripCazador
  {{1}} chollos nuevos este lunes. Top 3:
  • {{2}}
  • {{3}}
  • {{4}}
  Ver todos: https://tripcazador.com/deals
```

## 3. Variables de entorno Vercel

```bash
# Meta directo
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_BUSINESS_ACCOUNT_ID=...

# O Twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

## 4. Endpoints implementar (skeleton ya creado en `lib/whatsapp.ts`)

- `POST /api/whatsapp/subscribe` — usuario manda número, recibe template "welcome"
- `POST /api/whatsapp/webhook` — Meta envía replies/optouts (verify token)
- Cron en `worker.yml` — al detectar nuevo deal CRÍTICO, manda template `deal_alert_es` a suscriptores activos

## 5. Pricing (Stripe)

```bash
STRIPE_PRICE_WHATSAPP_MONTHLY=price_xxx  # €0.99/mes
```

Crea producto vía:
```bash
STRIPE_SECRET_KEY=sk_live_xxx python scripts/stripe_setup_whatsapp.py
```

## 6. Compliance / RGPD

- Doble opt-in obligatorio (verificar via SMS code el número antes de añadir a lista)
- Botón "Darse de baja" en cada mensaje (Meta exige)
- Política de privacidad debe mencionar WhatsApp expresamente
- No mandar entre 22:00-08:00 hora local del usuario
- Max 2 mensajes/día por usuario (anti-spam)

## 7. Activación

Cuando completes pasos 1-3:
1. Pega los envs en Vercel
2. Verifica webhook URL en Meta dashboard apunta a `https://tripcazador.com/api/whatsapp/webhook`
3. Manda template `deal_alert_es` de prueba a tu número
4. Trigger desde admin: `POST /api/admin/whatsapp/test` con tu número

## Estado actual TripCazador

- [ ] Paso 1: cuenta Meta/Twilio
- [ ] Paso 2: 2 templates aprobados
- [ ] Paso 3: envs Vercel
- [x] Paso 4: skeleton `lib/whatsapp.ts` creado
- [ ] Paso 5: producto Stripe €0.99/mes
- [ ] Paso 6: política privacidad mention
- [ ] Paso 7: smoke test
