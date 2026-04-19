# Memoria — Estrategias de detección de errores de precio v4

## Técnicas implementadas

### 1. Cross-date (comparar mismo hotel en distintas semanas)
- Si el mismo hotel cuesta un 60%+ menos una semana vs la mediana → ERROR
- Funciona bien en temporada ALTA (Navidad Maldivas, verano México)
- NO funciona en temporada baja ni en R. Dominicana (precios planos)

### 2. Peer comparison (comparar hoteles de mismas estrellas)
- Si un hotel es 45%+ más barato que la mediana de su categoría → sospechoso
- Detecta chollos pero NO errores reales (puede ser simplemente un hotel barato)

### 3. Room type comparison (simple vs doble)
- Comparar precio para 1 adulto vs 2 adultos en el MISMO hotel
- Si la doble cuesta MENOS que la simple → ERROR DE PRECIO CLARO
- El usuario encontró un error del 90% con esta técnica
- Implementado con --room-compare flag

### 4. Duration arbitrage (7n vs 14n)
- Comparar precio por noche entre estancias cortas y largas
- Si 14 noches TOTAL cuesta menos que 7 → ERROR imposible
- Si per-night 40%+ más barato → ANOMALÍA

### 5. Currency arbitrage (EUR/USD/GBP)
- Comparar mismo hotel en distintas monedas
- Booking convierte precios — a veces la conversión es errónea
- Si 30%+ diferencia → ERROR

### 6. Check-in day arbitrage
- Mismo hotel, misma semana, distinto día de check-in
- Lunes vs Miércoles vs Viernes
- Si 50%+ diferencia → ERROR

### 7. Room count comparison (1/2/3 habitaciones)
- Comparar precio por habitación con 1 vs 2 vs 3 habitaciones
- Si N habitaciones TOTAL cuesta menos que 1 → ERROR
- Encontró Costa Atlantica (DR) con 50% menos por hab

### 9. Mobile vs Desktop
- Comparar precios con user-agent de desktop vs móvil
- Si 30%+ diferencia → ERROR

### 10. Room type scraping (dentro de la página del hotel)
- Navegar a la página del hotel y extraer tipos de habitación
- Comparar Standard vs Deluxe vs Suite

## v4 Mejoras implementadas

### Multi-page scraping (Mejora 1)
- Ahora scrapeamos 2-4 páginas por destino (50-100 hoteles vs 25)
- Flag --pages N (1-4)
- Deduplicación entre páginas

### Destinos propensos a errores (Mejora 7)
- Presets: volatile-quick, volatile-italy, volatile-greece, volatile-turkey, etc.
- error-prone = todos los destinos volátiles combinados
- volatile-quick = 8 destinos clave para testing rápido

### Alta temporada (Mejora 6)
- --high-season christmas/summer_peak/easter_2027/etc.
- Fechas predefinidas donde los errores son más comunes
- WEEKS_TO_COMPARE subido a 8 por defecto

### SQLite precio histórico (Mejora 5)
- Base de datos local en price_history.db
- Guarda todos los precios scrapeados
- Flash detection: compara precios actuales vs históricos
- Si un hotel baja 25%+ desde la última vez → FLASH ALERT

### UA rotation (Mejora 8)
- 10 user-agents de desktop diferentes
- 4 user-agents móviles
- Rotación cada 5-8 búsquedas
- Reduce riesgo de bloqueo por Booking

## Destinos donde hay errores vs donde NO
- **CON errores:** México/Cancún/Tulum (verano), Maldivas (Navidad), Costa Amalfitana (verano), Phuket (Navidad)
- **SIN errores:** República Dominicana (precios planos todo el año), Maldivas (verano baja)
- Los errores aparecen en temporada ALTA con mucha volatilidad

## Parámetros del usuario (Ernesto)
- 4-5 estrellas
- Nota mínima 7.8
- Primera línea de playa
- Todo incluido
- 2 adultos, 1 habitación
- Moneda EUR
- Interesado en: Maldivas, R. Dominicana, México, Zanzíbar, Italia, Grecia

## Hoteles favoritos
- **Ayala Oceanview Maldives** (9/10) — 71€/noche en verano (buen precio)
- **h78 Iru** (8.6/10) — 77€/noche en verano

## Mejores errores encontrados
- **Petit Lafitte** (Playa del Carmen, México) — 1.475€ vs 3.983€ otras semanas = 79% OFF
- **LVIS Pool Villa** (Maldivas Navidad) — 67% OFF
- **Korè Hotel** (Costa Amalfitana, Navidad 2026) — 596€ vs mediana 3.505€ = 83% OFF (T1)

## Búsqueda Navidad 2026 resultados
- 4 destinos volátiles, 4 semanas, 2 páginas
- 104 hoteles únicos analizados
- **14 errores, 3 anomalías, 26 chollos, 13 flash drops**
- Mejor hallazgo: Korè Hotel (Amalfi) 83% OFF en Navidad

## Uso rápido v4

```bash
# Búsqueda rápida volátil
python main.py --dest volatile-quick --checkin 2026-12-20 --nights 7 --weeks 4 --stars 4 --pages 2

# Alta temporada Navidad
python main.py --dest volatile-quick --high-season christmas --nights 7 --stars 4 --pages 2

# Todas las técnicas (necesita más tiempo)
python main.py --dest custom --places "Cancún,Santorini" --checkin 2026-12-20 --nights 7 --weeks 4 --all-techniques --pages 2

# Solo duración + habitaciones
python main.py --dest custom --places "Destino" --checkin 2026-12-20 --nights 7 --weeks 3 --duration-compare --rooms-compare --pages 2
```
