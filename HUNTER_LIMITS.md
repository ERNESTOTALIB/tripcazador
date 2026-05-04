# Hunter free tier limits — análisis para "siempre-on" (SSS64)

## Estado actual (mayo 2026)

El worker `hunter` corre vía GitHub Actions cron cada 6h (`hunter-cron.yml`).
Limitaciones de las API gratuitas/baratas que usamos:

| API | Free tier | Límite hard | Coste si pasamos | Recomendación |
|---|---|---|---|---|
| **Travelpayouts Data API** | Ilimitado para conversion partners | Soft rate ~10 req/s | Gratis (siempre lo es para afiliados con tráfico) | Usar como fuente principal |
| **Duffel Live** | $0/mes hasta 100 búsquedas/día | 429 al pasar 100/día | $0.001/búsqueda extra | Mantener para deep-search premium concierge |
| **SerpAPI** | 100 búsquedas/mes free | 100/mes hard | $50/mes 5k búsquedas | Solo Google Hotels (evitar gastar en flights) |
| **RapidAPI Skyscanner** | $0 hasta 100 reqs/mes | 100/mes hard | $10/mes 1k reqs | Backup engine |
| **Ryanair scraper (custom)** | Gratis | Rate IP-throttled, ~30 reqs/min | Gratis | Mantener |
| **Vueling scraper (custom)** | Gratis | Rate IP-throttled, ~20 reqs/min | Gratis | Mantener |
| **Hotellook** | 1k reqs/día gratis | 1k/día | $0/mes hasta 10k/día | Sí, ampliar uso |
| **IATA / OpenFlights** | Gratis | Sin límite | Gratis | Static catalog |

## Cálculo "siempre-on" (cada 30 min)

Si convertimos cron de 6h → 30min:
- Frecuencia: 4× 30min = 2h, 48× 30min = 24h
- Hoy con 6h cron: 4 ejecuciones/día
- Con 30min: **48 ejecuciones/día**, 12× más

### Por API

**Travelpayouts**: sin coste (afiliado conversion, no cap real). ✅ Sí
**Duffel Live**: 100/día → si gastamos 5 búsquedas/exec × 48 = 240/día → **PASA EL CAP**. Hay que:
 - (a) Pagar plan Pro $99/mes (1k búsquedas/día) → ROI sólo si concierge €19 vende ≥6/mes
 - (b) Reducir a 2 búsquedas/exec → 96/día, justo bajo cap. Aceptable
 - (c) Mantener Duffel solo en deep-search concierge (no en cron) → ✅ recomendado
**SerpAPI**: 100/mes free → con 30min cron y 5 ciudades hotel = 240 búsquedas/día = **PASA EL CAP en 1 día**. Hay que:
 - (a) Comprar plan $50/mes 5k búsquedas → 166/día → 30min posible
 - (b) Reducir a hoteles solo cada 2h (12/día × 5 ciudades = 60/día) → free tier OK
 - (c) Cambiar a Booking.com scraper directo (sin SerpAPI) → research pendiente
**Ryanair scraper**: rate-limit ~30 reqs/min → cada exec 5min/cola = **OK con 30min cron**
**Vueling scraper**: igual
**Hotellook**: 1k/día → 200/día (5 ciudades × 40 fechas) → **OK incluso en 30min**

## Decisión recomendada

### Opción A — siempre-on lite (gratis o ~$50/mes)
- Cron 30min: SOLO Travelpayouts + Ryanair + Vueling + Hotellook
- Duffel y SerpAPI quedan en deep-search bajo demanda (concierge €19)
- Coste: $0 si SerpAPI free es suficiente, $50/mes si quieres SerpAPI hotels en cron
- Volumen estimado: 48× más detección que ahora

### Opción B — siempre-on full ($150/mes)
- Cron 30min con todas las APIs activas
- Duffel Pro $99 + SerpAPI $50
- Volumen: máximo posible
- ROI: necesitas vender ≥10 concierge/mes para break-even

### Opción C — mantener 6h pero diversificar templates (gratis, ya cumplido en SSS46)
- Status quo con MEGA_ORIGINS preset → 60+ rutas distintas por exec
- 0 coste extra, mismo cap actual

## Recomendación práctica para mayo 2026

**Opción A**, foco gratis. Razonamiento:
1. Tráfico actual ~137 unique/día — con 48× freshness el bottleneck es **conversion** no detection
2. Concierge €19 todavía sin ventas medibles → no justifica $99/mes Duffel Pro
3. Si en 60 días vendemos ≥10 concierge → upgrade a Opción B
4. Si /deals/clicks aumenta 3× tras Opción A → señal para upgrade

## Bloqueadores técnicos

- GH Actions concurrency: cron 30min posible, hace falta `concurrency.cancel-in-progress: true`
- Vercel Cron como alternativa: cap 1 cron/día en plan Hobby; necesitamos Pro ($20/mes) para 24/h
- Persistencia inter-run: actualmente hunter dump a `/var/lib/tripcazador/deals.jsonl` en VPS — sigue funcionando con 30min sin problema (rotación 100MB/mes)

## Pendiente para SSS65

- Workflow `hunter-cron-30min.yml` con concurrency control
- Métricas de cap: cuando rate-limit → emit alerta vía `health-watch` Telegram
- Dashboard `/panel` widget "Last hunt: X min ago, next in Y min"
