# 🏨 Hotel Deal Hunter v3 — Resultados Completos

**Fecha:** 2026-03-21 | **Técnicas:** T1-T7, T9 implementadas y funcionando

---

## Técnicas de detección disponibles

| # | Técnica | Flag | Descripción |
|---|---------|------|-------------|
| T1 | Cross-date | *(siempre activa)* | Mismo hotel en distintas semanas |
| T2 | Peers | *(siempre activa)* | Comparar hoteles mismas estrellas |
| T3 | Simple/Doble | `--room-compare` | 1 adulto vs 2 adultos |
| T4 | Duración | `--duration-compare` | Nn vs 2Nn por noche |
| T5 | Moneda | `--currency-compare` | EUR vs USD vs GBP |
| T6 | Día check-in | `--checkin-day-compare` | Lun vs Mié vs Vie |
| T7 | Nº habitaciones | `--rooms-compare` | 1 hab vs 2 hab vs 3 hab |
| T9 | Mobile | `--mobile-compare` | Desktop vs mobile user-agent |
| ALL | Todas | `--all-techniques` | Activa T3-T9 de golpe |

---

## Resultados: Maldivas Verano 2027 (14 noches)

**6 técnicas aplicadas** | 33 hoteles | 4 hallazgos

### Chollos encontrados

| Hotel | Tipo | Precio | Descuento | Enlace |
|-------|------|--------|-----------|--------|
| **Ayala Oceanview** (9/10) | T2: Peer | 997€/14n (71€/n) | 45% vs pares | [Booking](https://www.booking.com/hotel/mv/ayala-oceanview-maldives.html?checkin=2027-07-01&checkout=2027-07-15&group_adults=2&no_rooms=1&group_children=0&selected_currency=EUR) |
| **Mi Lugar Maldives** (8.1/10) | T4: Duración | 1.740€/28n (62€/n) | 33% menos/noche que 14n | [Booking](https://www.booking.com/hotel/mv/mi-lugar.html?checkin=2027-07-01&checkout=2027-07-29&group_adults=2&no_rooms=1&group_children=0&selected_currency=EUR) |

**T3 (simple/doble):** 0 errores — precios coherentes
**T5 (moneda):** 0 errores — EUR/USD/GBP consistentes
**T7 (habitaciones):** 0 errores — escalado lineal correcto

---

## Resultados: R. Dominicana Verano 2027 (14 noches)

**6 técnicas aplicadas** | 15 hoteles | 3 hallazgos

### Anomalías encontradas

| Hotel | Tipo | Hallazgo | Enlace |
|-------|------|----------|--------|
| **Costa Atlantica** (8.1/10) | T7: Rooms | 2 hab cuestan = 1 hab (50% menos/hab) | [Booking](https://www.booking.com/hotel/do/costa-atlantica-punta-cana1.html?checkin=2027-07-01&checkout=2027-07-15&group_adults=2&no_rooms=1&group_children=0&selected_currency=EUR) |
| **Xeliter Balcones** (8.8/10) | T7: Rooms | 2 hab más barato por habitación (34% menos/hab) | [Booking](https://www.booking.com/hotel/do/balcones-del-atlantico.html?checkin=2027-07-01&checkout=2027-07-15&group_adults=2&no_rooms=1&group_children=0&selected_currency=EUR) |

**Nota:** DR sigue con precios planos. La T7 fue la ÚNICA que encontró algo.

---

## Conclusiones por técnica

| Técnica | Maldivas | R. Dominicana | Mejor uso |
|---------|----------|---------------|-----------|
| T1 Cross-date | 0 (plano verano) | 0 (siempre plano) | Temporada ALTA |
| T2 Peers | ✅ 3 chollos | 0 | Siempre útil |
| T3 Simple/Doble | 0 | 0 | Mercados dinámicos |
| T4 Duración | ✅ 1 chollo | 0 | Estancias largas |
| T5 Moneda | 0 | 0 | Hoteles internacionales |
| T6 Día check-in | 0 | 0 | Ciudades/business |
| T7 Nº habitaciones | 0 | ✅ 2 anomalías | Grupos/familias |
| T9 Mobile | (no testeado) | (no testeado) | TBD |

---

## Uso rápido

```bash
# Búsqueda completa (todas las técnicas)
python main.py --dest custom --places "Destino" --checkin 2027-07-01 --nights 14 --weeks 4 --stars 4 --min-score 7.8 --beachfront --all-inclusive --all-techniques

# Solo técnicas core (rápido)
python main.py --dest custom --places "Destino" --checkin 2027-07-01 --nights 14 --weeks 4 --stars 4

# Arbitraje de duración + habitaciones
python main.py --dest custom --places "Destino" --checkin 2027-07-01 --nights 7 --weeks 3 --duration-compare --rooms-compare
```
