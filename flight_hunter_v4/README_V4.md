# ✈️ Flight Hunter V4 — Error Fares & Business at Economy Prices

**El buscador más potente para encontrar error fares y Business class a precio de economy, desde cualquier aeropuerto de Europa.**

---

## 🚀 Mejoras principales sobre V2

| Característica | V2 | V4 |
|---|---|---|
| Aeropuertos europeos | 23 | **85+** |
| Fuente principal | SerpApi (100/mes) | **Kiwi (ILIMITADO)** |
| Modo "anywhere" | ❌ | **✅ fly_to=anywhere** |
| Búsqueda por rango de fechas | ❌ | **✅ mes completo** |
| Business Hunter dual (B+E) | Básico | **✅ Ratio B/E automático** |
| Dashboard HTML interactivo | ❌ (solo Markdown) | **✅ Filtros, sorting, links** |
| Alertas Telegram | ❌ | **✅ Tiempo real** |
| Técnicas de detección | 5 | **8 técnicas + scoring** |
| Clasificación | 3 niveles | **4 niveles (CRÍTICO/ERROR/ANOMALÍA/OFERTA)** |
| Export CSV | ❌ | **✅ Un clic** |

---

## ⚡ Configuración (5 minutos)

### 1. API Key Kiwi (OBLIGATORIA — GRATIS)
```bash
# Registrar en: https://tequila.kiwi.com/portal/login
export KIWI_API_KEY=tu_api_key_aqui
```

### 2. Alertas Telegram (OPCIONAL — muy recomendado)
```bash
# 1. Hablar con @BotFather → /newbot → copiar token
export TELEGRAM_BOT_TOKEN=tu_token

# 2. Enviar cualquier mensaje al bot y abrir:
#    https://api.telegram.org/bot<TOKEN>/getUpdates
# 3. Copiar el chat_id
export TELEGRAM_CHAT_ID=tu_chat_id
```

### 3. Instalar dependencias
```bash
cd flight_hunter_v4
pip install aiohttp --break-system-packages
```

---

## 🎯 Modos de uso

### MODO 1: ANYWHERE (el más potente)
Busca desde **todos los aeropuertos europeos** a **cualquier destino del mundo**.
```bash
python main.py --mode anywhere \
  --date-from 2026-06-01 --date-to 2026-08-31 \
  --origins tier1 \
  --cabin economy
```
→ Una sola ejecución descubre miles de deals que nunca buscarías con rutas fijas.

### MODO 2: BUSINESS HUNTER
Detecta Business class a precio de economy (ratio B/E < 2-3x).
```bash
python main.py --mode business-hunter \
  --origins tier1 \
  --date-from 2026-06-01 --date-to 2026-08-31
```
→ Busca Economy + Business simultáneamente. Ratio normal: 5-8x. Ratio < 2x = ERROR FARE.

### MODO 3: ERROR HUNTER
Se centra en los 12 destinos más volátiles (mayor historial de error fares):
Cancún, Bangkok, Tokio, Nueva York, Dubai, Maldivas, São Paulo, Johannesburgo, Sydney, Punta Cana, Singapur, Mauricio.
```bash
python main.py --mode error-hunter \
  --origins all \
  --date-from 2026-05-15 --date-to 2026-06-30
```

### MODO 4: MATRIX
Mejor precio disponible en todo el período para destinos específicos.
```bash
python main.py --mode matrix \
  --dest caribbean \
  --origins "MAD,BCN,VLC,AGP,SVQ" \
  --date-from 2026-07-01 --date-to 2026-09-30
```

### MODO 5: CUSTOM
Rutas y cabina específicas.
```bash
# Business a Tokio desde aeropuertos tier1:
python main.py --mode custom \
  --dest "NRT,HND" \
  --origins tier1 \
  --date-from 2026-06-01 --date-to 2026-09-30 \
  --cabin business

# Economy Caribbean desde España + Portugal:
python main.py --mode custom \
  --dest caribbean \
  --origins "MAD,BCN,LIS,OPO" \
  --date-from 2026-07-01 --date-to 2026-08-31
```

### MODO 6: MONITOR (con alertas Telegram)
Ejecuta en bucle y alerta en tiempo real.
```bash
python main.py --mode monitor \
  --interval 3600 \
  --telegram
```

---

## 📊 Opciones de origen (--origins)

| Valor | Aeropuertos | Descripción |
|---|---|---|
| `tier1` | 25 | Grandes hubs: CDG, FRA, AMS, MAD, BCN, LHR, MXP, FCO, IST... |
| `tier2` | 60+ | Regionales: PMI, AGP, BER, HAM, DUS, OPO, LYS, etc. |
| `all` | 85+ | Todos los aeropuertos europeos |
| `transatlantic` | 16 | Mejores conexiones EEUU/LATAM |
| `asia` | 13 | Mejores conexiones Asia/Oriente Medio |
| `CDG,FRA,MAD` | custom | Códigos IATA separados por coma |

## 🌍 Opciones de destino (--dest)

| Valor | Destinos incluidos |
|---|---|
| `anywhere` | Cualquier destino del mundo (fly_to=anywhere) |
| `volatile` | 12 destinos más propensos a error fares |
| `caribbean` | Punta Cana, Cancún, San Juan, Barbados, Aruba... |
| `japan-korea` | Tokio, Seúl, Osaka, Sapporo, Okinawa |
| `north-america` | JFK, LAX, MIA, SFO, ORD, Toronto, Vancouver... |
| `southeast-asia` | Bangkok, Singapur, Bali, Manila, Ho Chi Minh... |
| `oceania` | Sydney, Melbourne, Auckland, Perth |
| `africa` | Johannesburgo, Nairobi, Mauricio, Ciudad del Cabo... |
| `maldives` | Solo Maldivas (siempre interesante para errores) |
| `all` | Todos los destinos long-haul (~105 aeropuertos) |

---

## 🧠 Técnicas de detección (8 técnicas)

| ID | Técnica | Descripción |
|---|---|---|
| T0 | Error fare absoluto | Precio por debajo de umbrales imposibles |
| T1 | Cross-date | Precio mucho más bajo que otras fechas misma ruta |
| T4 | Ratio Business/Economy | Business < 2x Economy = ERROR FARE |
| T5 | Baseline histórico | Caída > 30% vs. media últimos 30 días |
| T6 | Flash drop | Caída > 25% en < 24 horas |
| T7 | Patrón aerolínea | Aerolínea con historial de error fares |

**Clasificaciones:**
- 🚨 **CRÍTICO**: Confirmado por 2+ técnicas, score > 75
- ❌ **ERROR**: Posible error fare, score > 50
- ⚠️ **ANOMALÍA**: Precio inusualmente bajo, score > 30
- 💰 **OFERTA**: Precio muy bueno, score > 15

---

## 📱 Dashboard HTML

Cada ejecución genera:
1. `FLIGHT_HUNTER_V4_[MODO]_[TIMESTAMP].html` — Dashboard interactivo (abrir en navegador)
2. `FLIGHT_HUNTER_V4_[MODO]_[TIMESTAMP].md` — Reporte Markdown

El dashboard HTML incluye:
- Tabla con **sorting** por cualquier columna
- **Filtros** por cabina, clasificación, precio máximo, ratio B/E
- **Color coding**: rojo=crítico, naranja=error, amarillo=anomalía, verde=oferta
- **Links directos de reserva** para cada deal
- **Export CSV** con un clic
- Cards de los mejores deals al inicio

---

## 🔑 APIs utilizadas

| API | Coste | Límite | Descripción |
|---|---|---|---|
| **Kiwi Tequila** | **GRATIS** | **Ilimitado** | 750+ aerolíneas, tiempo real, fly_to=anywhere |
| Travelpayouts | Gratis | 200 req/hora | Precios cacheados 2-7 días |
| Duffel | Gratis (búsquedas) | Generoso | 300+ aerolíneas, tiempo real |
| SerpApi | Gratis | 100/mes | Google Flights |

**Nota**: V4 usa Kiwi como fuente primaria (ilimitada y gratuita). SerpApi se reserva para validación.

---

## 📁 Estructura

```
flight_hunter_v4/
├── main.py           # CLI principal — punto de entrada
├── config.py         # Configuración: aeropuertos, destinos, umbrales
├── kiwi_engine.py    # Motor Kiwi: anywhere, rangos, Business Hunter dual
├── detector.py       # 8 técnicas de detección + scoring + Markdown report
├── html_report.py    # Dashboard HTML interactivo
├── notifier.py       # Telegram + log de archivo
├── db.py             # SQLite: historial de precios, baselines
└── requirements.txt  # aiohttp
```
