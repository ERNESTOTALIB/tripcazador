# 🎯 TripCazador Social Carousel — Template oficial SSS65

Pipeline de generación de carruseles Instagram (5 plates 1080×1080) +
profile pic + biblioteca de copy.

## Estructura

```
scripts/social_carousel/
├── render_template.py     # Renderer principal (Barcelona como demo)
├── render_profile_pic.py  # Genera ig_profile_pic.png (1080 + 320)
├── ig_profile_pic.png     # Avatar IG actual (logo amber/navy)
├── CONTENT_LIBRARY.md     # Subtítulos / captions / hashtags variados
├── PHILOSOPHY.md          # Mediterranean Cartography design philosophy
└── README.md              # Este archivo
```

## Cómo usar para nueva ciudad

1. Copia `render_template.py` → `render_<ciudad>.py`
2. Cambia el dict `PHOTOS = {...}` con URLs verificadas Wikimedia (5 landmarks)
3. Edita `OUT = Path(...)` al directorio destino
4. En `plate_1_hero()` actualiza:
   - Nombre ciudad → `city = "TOKIO"`
   - Coordenadas → `coord = "35°41′ N · 139°41′ E"`
   - Datos vuelo → ruta + ida + vuelta + duración + savings
   - Hook → `¿Listo para que en X estés conociendo 5 lugares...`
5. En `main()` actualiza las 4 llamadas a `taganga_plate()` con
   título, descripción, label_top, coord de cada landmark
6. Ejecuta: `python3 render_<ciudad>.py`

## Cadencia automática

Cron `0 */4 * * *` en `.github/workflows/instagram-publish.yml` (6 posts/día).
SSS65 incluye dedup origen+destino ventana 2 — el siguiente post NO repite
ningún aeropuerto del anterior.

## Profile pic

Para regenerar / actualizar el avatar:
```
python3 render_profile_pic.py
# Sube ig_profile_pic.png a https://instagram.com/accounts/edit/
```

## Bio recomendada (250 caracteres máx IG)

```
✈️ El cazador de chollos de vuelo
🔍 Error fares + ofertas verificadas a diario
🎯 Cada 4h un destino nuevo · ningún algoritmo
👇 Caza tu próximo viaje
🔗 tripcazador.com
```

(208 caracteres — cabe holgadamente)

Categoría sugerida IG Business: **Travel Company** o **Travel Agency**
