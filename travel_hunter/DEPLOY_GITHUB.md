# Travel Hunter - Despliegue en GitHub Actions

## Paso 1: Crear repositorio

```bash
# En tu portátil, dentro de la carpeta travel_hunter/
git init
git add .
git commit -m "Travel Hunter - búsqueda automática de viajes"

# Crear repo en GitHub (necesitas gh CLI o hacerlo desde github.com)
gh repo create travel-hunter --private --source=. --push
```

**IMPORTANTE**: Usa `--private` para que tus búsquedas y configuración no sean públicas.


## Paso 2: Configurar Gmail App Password

Para que el sistema te envíe emails necesitas una "App Password" de Gmail:

1. Ve a https://myaccount.google.com/security
2. Activa la **verificación en 2 pasos** si no la tienes
3. Ve a https://myaccount.google.com/apppasswords
4. Crea una nueva: nombre "Travel Hunter"
5. Copia la contraseña de 16 caracteres (ej: `abcd efgh ijkl mnop`)


## Paso 3: Configurar GitHub Secrets

Ve a tu repositorio en GitHub → Settings → Secrets and variables → Actions → New repository secret

Crea estos 5 secrets:

| Secret | Valor | Ejemplo |
|--------|-------|---------|
| `SMTP_EMAIL` | Tu email de Gmail | `tumail@gmail.com` |
| `SMTP_PASSWORD` | App Password de Gmail | `abcdefghijklmnop` |
| `RECIPIENT_EMAIL` | Donde recibir alertas | `tumail@gmail.com` (puede ser el mismo) |
| `TEQUILA_API_KEY` | API key de Tequila/Kiwi (gratis) | `abCdEfGhIjKlMnOp...` |
| `SEARCH_CONFIG` | JSON con tus búsquedas | Ver abajo |

### Configurar Tequila API (fuente principal de vuelos)

1. Ve a https://tequila.kiwi.com/portal/login
2. Crea una cuenta (gratis)
3. Crea una "Solution" (nombre: "Travel Hunter")
4. Copia el API key
5. Pégalo en el secret `TEQUILA_API_KEY`

Esto te da 3000 búsquedas/mes gratis con precios REALES y links de reserva.
Es la fuente más fiable, mucho mejor que el scraping.


### Formato de SEARCH_CONFIG

Copia y pega este JSON en el secret `SEARCH_CONFIG`, editando los valores:

```json
[
    {
        "name": "Grecia Agosto 2026 desde SXB",
        "flight_params": {
            "origin": "SXB",
            "destination": "ATH",
            "date_depart": "2026-08-01",
            "date_return": "2026-08-15",
            "adults": 4,
            "children": 0,
            "infants_lap": 1,
            "cabin_class": "economy",
            "currency": "EUR"
        },
        "hotel_params": {
            "destination": "Atenas, Grecia",
            "checkin": "2026-08-01",
            "checkout": "2026-08-11",
            "adults": 4,
            "children": 1,
            "children_ages": [1],
            "rooms": 2,
            "currency": "EUR",
            "board_type": "all_inclusive",
            "stars": [4, 5],
            "min_review_score": 8.0
        }
    },
    {
        "name": "Grecia desde Basel",
        "flight_params": {
            "origin": "BSL",
            "destination": "ATH",
            "date_depart": "2026-08-01",
            "date_return": "2026-08-15",
            "adults": 4,
            "children": 0,
            "infants_lap": 1,
            "cabin_class": "economy",
            "currency": "EUR"
        },
        "hotel_params": null
    },
    {
        "name": "Grecia desde Frankfurt",
        "flight_params": {
            "origin": "FRA",
            "destination": "ATH",
            "date_depart": "2026-08-01",
            "date_return": "2026-08-15",
            "adults": 4,
            "children": 0,
            "infants_lap": 1,
            "cabin_class": "economy",
            "currency": "EUR"
        },
        "hotel_params": null
    }
]
```

**Puedes añadir tantas búsquedas como quieras.** Cada una busca desde un aeropuerto diferente o con un destino diferente.


## Paso 4: Activar el workflow

El workflow se activa automáticamente con el cron schedule. Pero puedes probarlo manualmente:

1. Ve a tu repo en GitHub → Actions → "Travel Hunter"
2. Click "Run workflow"
3. Selecciona `full` para búsqueda completa o `urls_only` para solo URLs
4. Click "Run workflow"


## Paso 5: Verificar

- Revisa tu email en unos minutos
- En GitHub → Actions verás el log de cada ejecución
- Los resultados se guardan como "Artifacts" en cada run


## Horario de ejecución

El cron está configurado para zona horaria CET (Estrasburgo):

| Hora CET | Tipo |
|-----------|------|
| 02:00 | Noche |
| 06:00 | Noche |
| 07:00 | Día |
| 11:00 | Día |
| 15:00 | Día |
| 19:00 | Día |
| 23:00 | Día |

= 7 ejecuciones/día × ~5 min = ~35 min/día × 30 días = ~1050 min/mes (de 2000 gratis)


## Cambiar búsquedas

Para cambiar destinos, fechas o viajeros:

1. Ve a GitHub → Settings → Secrets → `SEARCH_CONFIG`
2. Edita el JSON
3. El próximo cron usará la nueva configuración

NO necesitas tocar el código.


## Solución de problemas

**"No recibo emails"**
- Verifica que los secrets están bien configurados
- Revisa la carpeta de spam
- En Actions → último run → "search_output.log", busca errores de SMTP

**"El scraping no extrae precios"**
- Es normal. Google Flights y Skyscanner bloquean IPs de cloud
- Siempre recibirás las URLs para buscar manualmente
- Los errores de precio se detectan cuando SÍ consigue extraer datos

**"Quiero desactivar temporalmente"**
- Ve a Actions → "Travel Hunter" → botón "..." → "Disable workflow"

**"Quiero añadir más aeropuertos"**
- Edita el secret SEARCH_CONFIG y añade más objetos al array
