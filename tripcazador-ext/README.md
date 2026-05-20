# TripCazador Browser Extension

Chrome/Firefox extension que detecta búsquedas en Skyscanner, Google Flights,
Kayak y Booking, y muestra un overlay con chollos de TripCazador para la
misma ruta si existen.

## Stack

- Manifest V3 (Chrome 100+, Edge, Brave; Firefox MV3 desde 109)
- Service worker background + content scripts
- chrome.storage.local cache (30 min TTL)
- Zero deps, vanilla JS

## Estructura

```
tripcazador-ext/
├── manifest.json
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
└── src/
    ├── background.js       # Service worker — fetch + cache deals
    ├── content.js          # Inyectado en sites — detect route + overlay
    ├── overlay.css         # Estilos overlay
    ├── popup.html          # Popup al click icon
    └── popup.js            # Stats popup
```

## Sites soportados

- skyscanner.es / .com
- google.com/flights
- kayak.es / .com
- booking.com
- (Más en próximas versiones: vueling, iberia, ryanair direct)

## Dev / install local

1. Chrome → chrome://extensions/
2. Activa "Developer mode"
3. Click "Load unpacked" → selecciona `tripcazador-ext/`
4. La extensión queda instalada en modo dev
5. Visita skyscanner.es/transport/flights/mad/tyo/ → debe aparecer overlay

## Publish a Chrome Web Store

1. Empaquetar:
   ```bash
   cd tripcazador-ext
   zip -r tripcazador-ext-v0.1.0.zip . -x ".*" "README.md"
   ```

2. Subir a https://chrome.google.com/webstore/devconsole/
   (Pago único $5 lifetime)

3. Rellenar listing:
   - Categoría: Productividad
   - Idioma principal: Español
   - Privacy policy: https://tripcazador.com/legal#privacidad
   - Single purpose: "Comparar precios de vuelos con TripCazador"

4. Subir capturas (1280×800):
   - Overlay en Skyscanner
   - Overlay en Google Flights
   - Popup stats
   - Popup CTA Premium

5. Review típica: 1-2 semanas

## Publish a Firefox Add-ons

1. Web-ext sign:
   ```bash
   npm install -g web-ext
   web-ext sign --api-key=XXX --api-secret=YYY
   ```
2. Subido auto a addons.mozilla.org

## Tracking

Extension envía `utm_source=ext-chrome` en cada link click → trackeable
en Google Analytics como segmento de audiencia.

## Roadmap

- [ ] Detectar más sites (Vueling, Iberia, eDreams, Vol1)
- [ ] OAuth login para sincronizar favoritos con cuenta TripCazador
- [ ] Notification API push cuando aparece deal nuevo de tus rutas saved
- [ ] i18n inglés
- [ ] Firefox build separate (mismo manifest pero diferente identity)
