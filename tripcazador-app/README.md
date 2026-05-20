# TripCazador Mobile (iOS + Android)

App nativa de TripCazador.com construida con **Expo SDK 51** + **React Native 0.74** + **Expo Router 3** (file-based routing).

Comparte el backend con la web (`tripcazador-web`) — no duplica datos, solo UI nativa optimizada para mobile.

## Tech stack

- **Expo SDK 51** (managed workflow, EAS Build para production)
- **TypeScript** strict
- **Expo Router** (file-based, type-safe routes)
- **React Native 0.74** (new arch ready — disabled hasta probar en QA)
- **Expo Notifications** para push
- **Expo SecureStore** para tokens (Keychain iOS / EncryptedSharedPrefs Android)
- **AsyncStorage** para flags no-sensibles
- **Expo Web Browser** para Stripe Checkout + booking_url + i18n landings (in-app browser, no abandonar la app)
- **Jest + jest-expo** para tests

## Estructura

```
tripcazador-app/
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx              # Root Stack navigator + Sentry + Splash
│   ├── (tabs)/                  # Tab navigator (4 tabs)
│   │   ├── _layout.tsx
│   │   ├── index.tsx            # 🏠 Home / Deals feed
│   │   ├── alerts.tsx           # 🔔 Alertas (Premium gated)
│   │   ├── explore.tsx          # 🌍 Explorar (regiones + tools)
│   │   └── account.tsx          # 👤 Cuenta / Premium status
│   ├── deal/[id].tsx            # Deal detail (modal)
│   ├── premium.tsx              # Paywall + Stripe checkout
│   ├── concierge.tsx            # 4 tiers Concierge
│   ├── onboarding.tsx           # 3 step onboarding + push permission
│   └── settings.tsx             # Privacy + version + legal links
├── src/
│   ├── components/              # DealCard, EmptyState, LoadingScreen…
│   ├── hooks/                   # useDeals, usePremium, useOnboarding
│   ├── lib/                     # api, auth, format, notifications, track
│   ├── constants/               # colors (brand), config (env)
│   └── types/                   # deal, premium (sync con web/src/lib)
├── assets/images/               # icon, splash, adaptive-icon, notification-icon
├── __tests__/                   # Unit tests
├── app.json                     # Expo config (iOS + Android)
├── eas.json                     # EAS Build / Submit profiles
└── package.json
```

## Setup (primer dev)

```bash
cd tripcazador-app
npm install
cp .env.example .env  # edita si necesario

# Dev server
npm start             # abre Expo Dev Tools
npm run ios           # iOS Simulator
npm run android       # Android emulator
```

Para device físico: instala **Expo Go** del store, escanea el QR.

## Tests

```bash
npm test              # jest unit tests
npm run typecheck     # tsc --noEmit
npm run lint          # expo lint
```

## EAS Build (production)

```bash
# Una vez:
npx eas-cli login
npx eas-cli init     # crea el projectId en app.json

# Build:
npx eas-cli build --profile preview --platform ios       # internal QA build
npx eas-cli build --profile preview --platform android   # APK
npx eas-cli build --profile production --platform all    # ambos para stores
```

## Submit a stores

```bash
# iOS — requiere appleId + ascAppId + teamId en eas.json
npx eas-cli submit --platform ios

# Android — requiere google-service-account.json en raíz
npx eas-cli submit --platform android
```

## Push notifications

El push se registra automáticamente en `onboarding.tsx` step 3 (después del consent del user). El token se POSTea a `/api/push/register` del backend.

Para enviar pushes de prueba:

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[xxx]",
    "sound": "default",
    "title": "🔥 Chollo: Madrid → Tokio 99€",
    "body": "65% de descuento. Stock limitado.",
    "data": { "kind": "deal", "deal_id": "deal_abc123" }
  }'
```

El listener en `_layout.tsx` deep-linkea al tap en función de `data.kind`.

## Integración con backend

Endpoints del backend (web Next.js) que la app consume:
- `GET /api/deals` — feed
- `GET /api/deals/[id]` — detail
- `POST /api/subscribe` — newsletter
- `POST /api/premium/checkout` — Stripe Session (open Stripe en in-app browser)
- `POST /api/premium/activate` — post-checkout activation
- `GET /api/premium/stats` — ROI widget (authed)
- `GET /api/premium/alerts` + `POST` / `DELETE` — alertas CRUD (authed)
- `GET /api/premium/watchlist` — watch list (authed)
- `POST /api/concierge/request-access` — magic-link concierge
- `POST /api/push/register` — registrar Expo token

Auth: bearer token guardado en SecureStore tras login Premium. Headers añadidos por `lib/auth.getAuthHeaders()`.

## Brand assets

Generados desde `tripcazador-web/public/brand/tripcazador-logo-mark.svg` vía cairosvg. Re-generar:

```bash
cd assets/images
python3 -c "
import cairosvg
SRC = '../../../tripcazador-web/public/brand/tripcazador-logo-mark.svg'
cairosvg.svg2png(url=SRC, write_to='icon.png', output_width=1024, output_height=1024)
cairosvg.svg2png(url=SRC, write_to='adaptive-icon.png', output_width=1024, output_height=1024)
cairosvg.svg2png(url=SRC, write_to='splash.png', output_width=480, output_height=480)
cairosvg.svg2png(url=SRC, write_to='favicon.png', output_width=32, output_height=32)
cairosvg.svg2png(url=SRC, write_to='notification-icon.png', output_width=96, output_height=96)
"
```

## Pendientes pre-publish

1. **EAS projectId**: ejecutar `npx eas-cli init` y commitear el `app.json` con `extra.eas.projectId`.
2. **iOS App Store Connect**: crear app, obtener `ascAppId` y `appleTeamId` → actualizar `eas.json`.
3. **Android Google Play Console**: crear app, obtener Service Account JSON → guardarlo como `google-service-account.json` (gitignored).
4. **Apple Push Notification key**: crear `.p8` en developer.apple.com → `npx eas-cli credentials` para subirlo.
5. **Apple Universal Links**: añadir `apple-app-site-association` al backend (`tripcazador-web/public/`) para que deep links de `tripcazador.com/deals/xxx` abran la app.
6. **Privacy policy + Terms**: confirmar que `/legal#privacidad` cubre tracking mobile.
7. **App Store screenshots**: 6.7" (Pro Max) + 6.5" + 5.5" + iPad 12.9" — generar desde simulador o Mockuuups.

## Roadmap inmediato

- [ ] Login flow con magic-link (similar al portal Concierge web)
- [ ] Watch deal CRUD nativo (actualmente solo toggle UI)
- [ ] Saved searches (NL parser similar a web)
- [ ] Hotel watchlist
- [ ] Trip planner combo (vuelo + hotel)
- [ ] Referidos UI nativo (compartir código TC-XXXXXXXX)
- [ ] Apple Wallet pass para chollos guardados
- [ ] Widget iOS (16+) con próximo chollo
- [ ] Live Activities iOS para "chollo expira en X min"

## Versionado + release

- `package.json` version + `app.json` version + `app.json` ios.buildNumber/android.versionCode deben ir en sync.
- EAS `autoIncrement: true` en `production` profile auto-incrementa build number.
- Release notes en `CHANGELOG.md` (TODO).
