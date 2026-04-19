"""
Flight Hunter V4 — Dashboard HTML con filtros avanzados
=======================================================
Filtros nuevos:
  - Región/continente (Europa, Asia, América Norte/Sur, Caribe, Oriente Medio, África, Oceanía)
  - País de destino (cascada desde región)
  - Duración del viaje (Fin de semana, 1 semana, 15 días, +15 días, Solo ida)
  - Solo vuelos directos
  - Origen del vuelo
  - Aerolínea
  - Precio máximo
  - Clasificación (Crítico, Error, Anomalía, Oferta)
"""

from datetime import datetime
from typing import List, Dict
from collections import defaultdict
import json
import config
from geo_data import enrich_geo, get_all_regions, get_countries_by_region


def _enrich_flights(flights: List[Dict]) -> List[Dict]:
    """Añade geo + duración a cada vuelo."""
    for f in flights:
        enrich_geo(f)
        # Calcular duración (noches)
        d_out = f.get("date_out", "")
        d_ret = f.get("date_ret", "")
        if d_out and d_ret and d_out != d_ret:
            try:
                nights = (datetime.strptime(d_ret, "%Y-%m-%d") -
                          datetime.strptime(d_out, "%Y-%m-%d")).days
                f["nights"] = max(0, nights)
            except Exception:
                f["nights"] = -1
        else:
            f["nights"] = -1  # Solo ida
    return flights


def _compute_chart_data(analyzed: List[Dict], all_flights: List[Dict]) -> Dict:
    # Distribución clasificación
    class_counts = defaultdict(int)
    for a in analyzed:
        class_counts[a.get("classification", "NORMAL")] += 1
    class_order = ["CRÍTICO", "ERROR", "ANOMALÍA", "OFERTA"]
    class_labels = [c for c in class_order if class_counts[c] > 0]
    class_data   = [class_counts[c] for c in class_labels]

    # Top 10 Business
    biz_deals = sorted([a for a in analyzed if a.get("cabin_code") in (3, 4)],
                        key=lambda x: x.get("price_eur", 9999))[:10]
    biz_labels = [f"{b['origin']}→{b.get('destination','?')} ({b.get('airline','?')})" for b in biz_deals]
    biz_prices = [b["price_eur"] for b in biz_deals]

    # Eco vs Biz por región
    region_eco = defaultdict(list)
    region_biz = defaultdict(list)
    for f in all_flights:
        r = f.get("region", "Internacional")
        if f.get("cabin_code") == config.CABIN_ECONOMY:
            region_eco[r].append(f.get("price_eur", 0))
        elif f.get("cabin_code") == config.CABIN_BUSINESS:
            region_biz[r].append(f.get("price_eur", 0))
    regions = sorted(set(list(region_eco.keys()) + list(region_biz.keys())))
    eco_avgs = [round(sum(region_eco[r])/len(region_eco[r])) if region_eco[r] else 0 for r in regions]
    biz_avgs = [round(sum(region_biz[r])/len(region_biz[r])) if region_biz[r] else 0 for r in regions]

    # Score distribution
    score_buckets = [0] * 10
    for a in analyzed:
        bucket = min(9, int(a.get("final_score", 0) / 10))
        score_buckets[bucket] += 1
    score_labels = [f"{i*10}-{i*10+9}" for i in range(10)]

    # Top aerolíneas
    airline_deals = defaultdict(list)
    for a in analyzed:
        al = a.get("airline_name") or a.get("airline", "?")
        if al and al != "?":
            airline_deals[al].append(a.get("price_eur", 0))
    top_airlines = sorted(airline_deals.items(), key=lambda x: len(x[1]), reverse=True)[:10]
    airline_labels = [a[0] for a in top_airlines]
    airline_counts = [len(a[1]) for a in top_airlines]

    # Deals por región
    region_counts = defaultdict(int)
    for a in analyzed:
        region_counts[a.get("region", "Internacional")] += 1
    region_count_labels = list(region_counts.keys())
    region_count_data   = [region_counts[r] for r in region_count_labels]

    return {
        "class_labels": class_labels, "class_data": class_data,
        "biz_labels": biz_labels, "biz_prices": biz_prices,
        "regions": regions, "eco_avgs": eco_avgs, "biz_avgs": biz_avgs,
        "score_labels": score_labels, "score_buckets": score_buckets,
        "airline_labels": airline_labels, "airline_counts": airline_counts,
        "region_count_labels": region_count_labels, "region_count_data": region_count_data,
    }


def _build_filter_options(flights: List[Dict]) -> Dict:
    """Extrae valores únicos para llenar los selects de filtros."""
    regions   = sorted(set(f.get("region", "") for f in flights if f.get("region")))
    countries = sorted(set(f.get("country_to", "") for f in flights if f.get("country_to")))
    origins   = sorted(set(f.get("origin", "") for f in flights if f.get("origin")))
    airlines  = sorted(set(f.get("airline_name") or f.get("airline", "") for f in flights
                           if f.get("airline_name") or f.get("airline")))
    # Map region → countries for cascade
    reg_ctry = defaultdict(set)
    for f in flights:
        r = f.get("region", "")
        c = f.get("country_to", "")
        if r and c:
            reg_ctry[r].add(c)
    reg_ctry_map = {r: sorted(cs) for r, cs in reg_ctry.items()}
    return {
        "regions": regions, "countries": countries, "origins": origins,
        "airlines": airlines, "reg_ctry_map": reg_ctry_map,
    }


def generate_html_dashboard(
    analyzed: List[Dict],
    search_params: Dict,
    all_flights: List[Dict] = None,
    output_path: str = None,
) -> str:
    all_flights = all_flights or analyzed
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    # Enriquecer con geo + duración
    _enrich_flights(analyzed)
    _enrich_flights(all_flights)

    # KPIs
    total     = len(analyzed)
    criticos  = sum(1 for a in analyzed if a.get("classification") == "CRÍTICO")
    errores   = sum(1 for a in analyzed if a.get("classification") == "ERROR")
    anomalias = sum(1 for a in analyzed if a.get("classification") == "ANOMALÍA")
    ofertas   = sum(1 for a in analyzed if a.get("classification") == "OFERTA")
    biz_deals = [a for a in analyzed if a.get("cabin_code") in (3, 4)]
    biz_min   = min((b["price_eur"] for b in biz_deals), default=0)
    avg_saving = round(sum(a.get("savings_eur", 0) for a in analyzed) / max(total, 1))

    mode        = search_params.get("mode", "custom")
    origins     = search_params.get("origins", [])
    origins_str = ", ".join(origins[:5]) + ("…" if len(origins) > 5 else "")
    date_from   = search_params.get("date_from", "")
    date_to     = search_params.get("date_to", "")
    cabin_str   = search_params.get("cabin", "Economy")

    flights_json = json.dumps(analyzed[:800], ensure_ascii=False, default=str)
    chart_data   = _compute_chart_data(analyzed, all_flights)
    chart_json   = json.dumps(chart_data, ensure_ascii=False)
    filter_opts  = _build_filter_options(analyzed)
    filter_json  = json.dumps(filter_opts, ensure_ascii=False)

    # Opciones para selects
    def opts(items):
        return "".join(f'<option value="{i}">{i}</option>' for i in items)

    region_opts  = opts(filter_opts["regions"])
    origin_opts  = opts(filter_opts["origins"])
    airline_opts = opts(filter_opts["airlines"])

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>✈️ Flight Hunter V4 — {now}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js"></script>
<style>
:root {{
  --bg:#f0f4f8;--card:#fff;--header:#1a1a2e;--text:#1a202c;--text2:#718096;
  --border:#e2e8f0;--accent:#4C72B0;--green:#38a169;--red:#e53e3e;
  --orange:#dd6b20;--yellow:#d69e2e;--purple:#7c3aed;
  --gap:14px;--radius:10px;--shadow:0 1px 4px rgba(0,0,0,.08);
}}
[data-theme=dark]{{--bg:#0f172a;--card:#1e293b;--header:#0a0f1e;--text:#f1f5f9;--text2:#94a3b8;--border:#334155;}}
*{{box-sizing:border-box;margin:0;padding:0;}}
body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);font-size:13px;line-height:1.5;}}

/* HEADER */
.hdr{{background:var(--header);color:#fff;padding:18px 24px;display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;}}
.hdr h1{{font-size:1.2rem;font-weight:800;}}
.hdr .meta{{font-size:.75rem;opacity:.65;margin-top:3px;}}
.hdr .tags{{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;}}
.tag{{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:#fff;padding:2px 9px;border-radius:20px;font-size:.72rem;}}
.btn-sm{{background:rgba(255,255,255,.15);border:none;color:#fff;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:.75rem;}}
.btn-sm:hover{{background:rgba(255,255,255,.25);}}

/* KPI */
.kpis{{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:var(--gap);padding:16px 24px;background:var(--card);border-bottom:1px solid var(--border);}}
.kpi{{background:var(--bg);border-radius:var(--radius);padding:14px 16px;border-left:4px solid var(--accent);}}
.kpi.c1{{border-color:var(--red);}} .kpi.c2{{border-color:var(--orange);}}
.kpi.c3{{border-color:var(--yellow);}} .kpi.c4{{border-color:var(--green);}}
.kpi.c5{{border-color:var(--purple);}} .kpi.c6{{border-color:var(--accent);}}
.kpi-lbl{{font-size:.68rem;color:var(--text2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;}}
.kpi-val{{font-size:1.7rem;font-weight:900;}}
.kpi-sub{{font-size:.7rem;color:var(--text2);margin-top:1px;}}

/* CHARTS */
.charts{{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:var(--gap);padding:16px 24px;}}
.ch-card{{background:var(--card);border-radius:var(--radius);padding:16px 18px;box-shadow:var(--shadow);}}
.ch-card h3{{font-size:.75rem;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px;}}
.ch-card canvas{{max-height:230px;}}

/* HERO DEALS */
.hero{{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:var(--gap);padding:4px 24px 16px;}}
.deal{{background:var(--card);border-radius:var(--radius);padding:14px 16px;box-shadow:var(--shadow);border-top:4px solid var(--accent);position:relative;overflow:hidden;}}
.deal.urg{{border-top-color:var(--red);}}
.deal.biz{{border-top-color:var(--purple);}}
.ribbon{{position:absolute;top:10px;right:-3px;background:var(--red);color:#fff;font-size:.6rem;font-weight:800;padding:2px 10px 2px 7px;border-radius:2px 0 0 2px;text-transform:uppercase;}}
.ribbon.bz{{background:var(--purple);}}
.d-route{{font-size:.95rem;font-weight:700;}}
.d-price{{font-size:1.7rem;font-weight:900;color:var(--green);margin:3px 0;}}
.d-det{{font-size:.73rem;color:var(--text2);line-height:1.8;}}
.d-btn{{display:inline-block;margin-top:9px;background:var(--accent);color:#fff;padding:4px 12px;border-radius:5px;text-decoration:none;font-size:.73rem;font-weight:700;}}
.d-btn:hover{{opacity:.85;}}

/* FILTER BAR — 2 filas */
.filters{{background:var(--card);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:10px 24px;position:sticky;top:0;z-index:30;}}
.frow{{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}}
.frow+.frow{{margin-top:7px;}}
.f-group{{display:flex;flex-direction:column;gap:2px;}}
.f-label{{font-size:.65rem;color:var(--text2);text-transform:uppercase;letter-spacing:.04em;font-weight:600;}}
select.ff,input.ff{{
  background:var(--bg);border:1px solid var(--border);color:var(--text);
  padding:5px 9px;border-radius:6px;font-size:.78rem;outline:none;
  transition:border-color .15s;min-width:110px;
}}
select.ff:focus,input.ff:focus{{border-color:var(--accent);}}
input.ff[type=text]{{min-width:160px;}}
input.ff[type=number]{{min-width:80px;}}
.f-check{{display:flex;align-items:center;gap:5px;font-size:.78rem;cursor:pointer;padding:4px 0;}}
.f-check input{{accent-color:var(--accent);width:14px;height:14px;cursor:pointer;}}
.f-btns{{display:flex;gap:6px;margin-left:auto;align-items:flex-end;}}
.count-pill{{background:var(--accent);color:#fff;padding:4px 12px;border-radius:20px;font-size:.78rem;font-weight:700;}}
.btn-act{{border:none;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:.75rem;font-weight:600;}}
.btn-reset{{background:var(--border);color:var(--text);}}
.btn-csv{{background:var(--green);color:#fff;}}
.btn-reset:hover{{background:var(--text2);color:#fff;}}
.btn-csv:hover{{background:#276749;}}

/* TABLE */
.tbl-wrap{{padding:0 24px 40px;overflow-x:auto;}}
table{{width:100%;border-collapse:collapse;font-size:.78rem;margin-top:12px;}}
thead th{{
  background:var(--card);padding:9px 11px;text-align:left;
  font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;
  color:var(--text2);cursor:pointer;border-bottom:2px solid var(--border);
  white-space:nowrap;user-select:none;
}}
thead th:hover{{color:var(--text);}}
thead th.sd::after{{content:' ↓';color:var(--accent);}}
thead th.sa::after{{content:' ↑';color:var(--accent);}}
tbody tr{{border-bottom:1px solid var(--border);transition:background .1s;}}
tbody tr:hover{{background:var(--bg);}}
tbody td{{padding:8px 11px;vertical-align:middle;white-space:nowrap;}}
.pill{{display:inline-flex;padding:2px 7px;border-radius:20px;font-size:.67rem;font-weight:700;text-transform:uppercase;}}
.pill.CRÍTICO{{background:#fff5f5;color:var(--red);}}
.pill.ERROR{{background:#fffaf0;color:var(--orange);}}
.pill.ANOMALÍA{{background:#fffff0;color:var(--yellow);}}
.pill.OFERTA{{background:#f0fff4;color:var(--green);}}
.p-eur{{font-size:.92rem;font-weight:800;color:var(--green);}}
.c-biz{{color:var(--purple);font-weight:700;}}
.c-eco{{color:var(--accent);}}
.s-wrap{{display:flex;align-items:center;gap:5px;}}
.s-bar{{height:4px;width:50px;background:var(--border);border-radius:2px;overflow:hidden;}}
.s-fill{{height:100%;background:linear-gradient(90deg,var(--green),var(--yellow),var(--red));}}
.book-a{{background:var(--accent);color:#fff;padding:3px 8px;border-radius:4px;text-decoration:none;font-size:.68rem;font-weight:700;}}
.book-a:hover{{opacity:.8;}}
.no-res{{text-align:center;padding:50px;color:var(--text2);display:none;}}
.dur-badge{{background:var(--bg);border:1px solid var(--border);color:var(--text2);padding:1px 6px;border-radius:4px;font-size:.67rem;}}

/* PAGINACIÓN */
.pag{{display:flex;gap:5px;align-items:center;padding:10px 24px;justify-content:center;flex-wrap:wrap;}}
.pbtn{{background:var(--card);border:1px solid var(--border);color:var(--text);padding:4px 10px;border-radius:5px;cursor:pointer;font-size:.75rem;}}
.pbtn:hover,.pbtn.on{{background:var(--accent);color:#fff;border-color:var(--accent);}}
.pinfo{{color:var(--text2);font-size:.75rem;}}

@media(max-width:768px){{
  .charts,.kpis,.hero{{grid-template-columns:1fr;}}
  .hdr,.charts,.hero,.tbl-wrap,.filters,.kpis,.pag{{padding-left:10px;padding-right:10px;}}
}}
</style>
</head>
<body>

<!-- HEADER -->
<div class="hdr">
  <div>
    <h1>✈️ Flight Hunter V4</h1>
    <div class="meta">Generado: {now}</div>
    <div class="tags">
      <span class="tag">🛫 {origins_str}</span>
      <span class="tag">📅 {date_from} → {date_to}</span>
      <span class="tag">💺 {cabin_str}</span>
      <span class="tag">🔍 {mode}</span>
      <span class="tag">🌍 {len(all_flights):,} vuelos analizados</span>
    </div>
  </div>
  <button class="btn-sm" onclick="toggleDark()">🌙 Dark</button>
</div>

<!-- KPIs -->
<div class="kpis">
  <div class="kpi c1"><div class="kpi-lbl">🚨 Críticos</div><div class="kpi-val" id="k0">{criticos}</div><div class="kpi-sub">Error fares confirmados</div></div>
  <div class="kpi c2"><div class="kpi-lbl">❌ Errores</div><div class="kpi-val" id="k1">{errores}</div><div class="kpi-sub">Posibles error fares</div></div>
  <div class="kpi c3"><div class="kpi-lbl">⚠️ Anomalías</div><div class="kpi-val" id="k2">{anomalias}</div><div class="kpi-sub">Precio inusualmente bajo</div></div>
  <div class="kpi c4"><div class="kpi-lbl">💰 Ofertas</div><div class="kpi-val" id="k3">{ofertas}</div><div class="kpi-sub">Precio competitivo</div></div>
  <div class="kpi c5"><div class="kpi-lbl">👑 Business mín.</div><div class="kpi-val" id="k4">{int(biz_min) if biz_min else '—'}{'€' if biz_min else ''}</div><div class="kpi-sub">{len(biz_deals)} deals Business</div></div>
  <div class="kpi c6"><div class="kpi-lbl">💵 Ahorro medio</div><div class="kpi-val" id="k5">{avg_saving}€</div><div class="kpi-sub">{total:,} anomalías totales</div></div>
</div>

<!-- GRÁFICOS -->
<div class="charts">
  <div class="ch-card"><h3>Clasificación</h3><canvas id="cCls"></canvas></div>
  <div class="ch-card"><h3>Deals por región</h3><canvas id="cReg"></canvas></div>
  <div class="ch-card"><h3>Precio medio por continente</h3><canvas id="cEco"></canvas></div>
  <div class="ch-card"><h3>Distribución de score (0–100)</h3><canvas id="cScore"></canvas></div>
</div>

<!-- HERO DEALS (Economy) -->
{_build_hero_cards(analyzed)}

<!-- BUSINESS DEALS SECTION -->
{_build_business_section(analyzed)}

<!-- FILTROS — 2 filas -->
<div class="filters">
  <!-- Fila 1: búsqueda libre + clasificación + cabina + precio + score -->
  <div class="frow">
    <div class="f-group">
      <span class="f-label">🔍 Búsqueda</span>
      <input type="text" class="ff" id="fQ" placeholder="destino, aerolínea, ciudad..." oninput="D.go()">
    </div>
    <div class="f-group">
      <span class="f-label">Clasificación</span>
      <select class="ff" id="fCls" onchange="D.go()">
        <option value="">Todas</option>
        <option value="CRÍTICO">🚨 Crítico</option>
        <option value="ERROR">❌ Error fare</option>
        <option value="ANOMALÍA">⚠️ Anomalía</option>
        <option value="OFERTA">💰 Oferta</option>
      </select>
    </div>
    <div class="f-group">
      <span class="f-label">Cabina</span>
      <select class="ff" id="fCab" onchange="D.go()">
        <option value="">Todas</option>
        <option value="economy">✈️ Economy</option>
        <option value="premium economy">🪑 Premium Economy</option>
        <option value="business">👑 Business</option>
        <option value="first">💎 First</option>
      </select>
    </div>
    <div class="f-group">
      <span class="f-label">Precio máx (€)</span>
      <input type="number" class="ff" id="fPx" placeholder="ej: 300" oninput="D.go()">
    </div>
    <div class="f-group">
      <span class="f-label">Score mín.</span>
      <input type="number" class="ff" id="fSc" placeholder="ej: 50" oninput="D.go()">
    </div>
    <label class="f-check"><input type="checkbox" id="fDirect" onchange="D.go()"> Solo directos</label>
    <div class="f-btns">
      <button class="btn-act btn-reset" onclick="D.reset()">✕ Limpiar</button>
      <button class="btn-act btn-csv" onclick="D.csv()">⬇️ CSV</button>
      <span class="count-pill" id="cnt">{total} resultados</span>
    </div>
  </div>
  <!-- Fila 2: región, país, duración, origen, aerolínea -->
  <div class="frow">
    <div class="f-group">
      <span class="f-label">🌍 Región / Continente</span>
      <select class="ff" id="fReg" onchange="D.onRegion()">
        <option value="">Todos los continentes</option>
        {region_opts}
      </select>
    </div>
    <div class="f-group">
      <span class="f-label">🏳️ País destino</span>
      <select class="ff" id="fCtry" onchange="D.go()">
        <option value="">Todos los países</option>
      </select>
    </div>
    <div class="f-group">
      <span class="f-label">⏱️ Duración del viaje</span>
      <select class="ff" id="fDur" onchange="D.go()">
        <option value="">Cualquier duración</option>
        <option value="ow">✈️ Solo ida (sin vuelta)</option>
        <option value="we">🏖️ Fin de semana (1–3 noches)</option>
        <option value="wk">📅 1 semana (4–8 noches)</option>
        <option value="2w">🌴 15 días (9–16 noches)</option>
        <option value="lg">🗺️ +15 días (17+ noches)</option>
      </select>
    </div>
    <div class="f-group">
      <span class="f-label">🛫 Aeropuerto origen</span>
      <select class="ff" id="fOrig" onchange="D.go()">
        <option value="">Todos los orígenes</option>
        {origin_opts}
      </select>
    </div>
    <div class="f-group">
      <span class="f-label">✈️ Aerolínea</span>
      <select class="ff" id="fAl" onchange="D.go()">
        <option value="">Todas las aerolíneas</option>
        {airline_opts}
      </select>
    </div>
    <div class="f-group">
      <span class="f-label">Mes de salida</span>
      <select class="ff" id="fMon" onchange="D.go()">
        <option value="">Todos los meses</option>
      </select>
    </div>
  </div>
</div>

<!-- TABLA -->
<div class="tbl-wrap">
<table id="tbl">
<thead><tr>
  <th onclick="D.sort('final_score')" id="h_final_score">Score</th>
  <th onclick="D.sort('classification')" id="h_classification">Tipo</th>
  <th onclick="D.sort('origin')" id="h_origin">Origen</th>
  <th onclick="D.sort('destination')" id="h_destination">Destino</th>
  <th onclick="D.sort('country_to')" id="h_country_to">País</th>
  <th onclick="D.sort('region')" id="h_region">Región</th>
  <th onclick="D.sort('cabin')" id="h_cabin">Cabina</th>
  <th onclick="D.sort('price_eur')" id="h_price_eur">Precio</th>
  <th onclick="D.sort('biz_ratio')" id="h_biz_ratio">Ratio B/E</th>
  <th onclick="D.sort('savings_eur')" id="h_savings_eur">Ahorro</th>
  <th onclick="D.sort('airline_name')" id="h_airline_name">Aerolínea</th>
  <th onclick="D.sort('date_out')" id="h_date_out">Salida</th>
  <th onclick="D.sort('nights')" id="h_nights">Duración</th>
  <th onclick="D.sort('stops')" id="h_stops">Escalas</th>
  <th>Reservar</th>
</tr></thead>
<tbody id="tbody"></tbody>
</table>
<div class="no-res" id="noRes">Sin resultados — prueba a cambiar los filtros</div>
</div>
<div class="pag" id="pag"></div>

<script>
const RAW = {flights_json};
const CD  = {chart_json};
const FM  = {filter_json};  // filter meta: reg_ctry_map, etc.
const PS  = 50; // page size

// ── Meses disponibles ─────────────────────────────────
const months = [...new Set(RAW.map(f=>f.date_out?f.date_out.slice(0,7):'').filter(Boolean))].sort();
const monSel = document.getElementById('fMon');
months.forEach(m=>{{ const o=document.createElement('option'); o.value=m; o.textContent=m; monSel.appendChild(o); }});

// ── Colores ──────────────────────────────────────────
const CLS_C = {{'CRÍTICO':'#e53e3e','ERROR':'#dd6b20','ANOMALÍA':'#d69e2e','OFERTA':'#38a169'}};
const PAL = ['#4C72B0','#DD8452','#55A868','#C44E52','#8172B3','#937860','#DA8BC3','#8C8C8C','#CCB974','#64B5CD'];

// ── Gráficos ────────────────────────────────────────
function mkChart(id, cfg) {{
  const el = document.getElementById(id);
  if (!el) return;
  return new Chart(el, cfg);
}}

// 1. Doughnut clasificación
mkChart('cCls', {{
  type:'doughnut',
  data:{{ labels:CD.class_labels,
    datasets:[{{data:CD.class_data,
      backgroundColor:CD.class_labels.map(l=>CLS_C[l]||'#999'),
      borderColor:'#fff',borderWidth:3}}] }},
  options:{{ responsive:true,maintainAspectRatio:false,cutout:'60%',
    plugins:{{ legend:{{position:'right',labels:{{usePointStyle:true,padding:12,font:{{size:11}}}}}} }} }}
}});

// 2. Doughnut región
mkChart('cReg', {{
  type:'doughnut',
  data:{{ labels:CD.region_count_labels,
    datasets:[{{data:CD.region_count_data,
      backgroundColor:PAL.slice(0,CD.region_count_labels.length),
      borderColor:'#fff',borderWidth:3}}] }},
  options:{{ responsive:true,maintainAspectRatio:false,cutout:'55%',
    plugins:{{ legend:{{position:'right',labels:{{usePointStyle:true,padding:10,font:{{size:11}}}}}} }} }}
}});

// 3. Bar – precio medio por región
mkChart('cEco', {{
  type:'bar',
  data:{{ labels:CD.regions,
    datasets:[
      {{label:'Economy',data:CD.eco_avgs,backgroundColor:'#4C72B0BB',borderColor:'#4C72B0',borderWidth:1,borderRadius:4}},
      {{label:'Business',data:CD.biz_avgs,backgroundColor:'#8172B3BB',borderColor:'#8172B3',borderWidth:1,borderRadius:4}},
    ] }},
  options:{{ responsive:true,maintainAspectRatio:false,
    plugins:{{ legend:{{position:'top',labels:{{usePointStyle:true}}}} }},
    scales:{{ x:{{grid:{{display:false}}}},y:{{ticks:{{callback:v=>v+'€'}}}} }} }}
}});

// 4. Line – distribución scores
mkChart('cScore', {{
  type:'line',
  data:{{ labels:CD.score_labels,
    datasets:[{{label:'Nº de deals',data:CD.score_buckets,
      borderColor:'#55A868',backgroundColor:'#55A86818',
      borderWidth:2,fill:true,tension:0.3,pointRadius:3}}] }},
  options:{{ responsive:true,maintainAspectRatio:false,
    plugins:{{ legend:{{display:false}} }},
    scales:{{ x:{{grid:{{display:false}}}},y:{{beginAtZero:true}} }} }}
}});

// ── Dashboard ───────────────────────────────────────
class Dashboard {{
  constructor() {{
    this.data = [...RAW];
    this.fil  = [...RAW];
    this.col  = 'final_score';
    this.asc  = false;
    this.pg   = 0;
    this.sort('final_score', false);
  }}

  onRegion() {{
    const reg = document.getElementById('fReg').value;
    const cSel = document.getElementById('fCtry');
    cSel.innerHTML = '<option value="">Todos los países</option>';
    if (reg && FM.reg_ctry_map[reg]) {{
      FM.reg_ctry_map[reg].forEach(c => {{
        const o = document.createElement('option');
        o.value = c; o.textContent = c;
        cSel.appendChild(o);
      }});
    }}
    this.go();
  }}

  go() {{
    const q    = document.getElementById('fQ').value.toLowerCase();
    const cls  = document.getElementById('fCls').value;
    const cab  = document.getElementById('fCab').value;
    const px   = parseFloat(document.getElementById('fPx').value) || Infinity;
    const sc   = parseFloat(document.getElementById('fSc').value) || 0;
    const dir  = document.getElementById('fDirect').checked;
    const reg  = document.getElementById('fReg').value;
    const ctry = document.getElementById('fCtry').value;
    const dur  = document.getElementById('fDur').value;
    const orig = document.getElementById('fOrig').value;
    const al   = document.getElementById('fAl').value;
    const mon  = document.getElementById('fMon').value;

    this.fil = this.data.filter(f => {{
      if (q) {{
        const hay = [f.destination,f.city_to,f.country_to,f.region,f.origin,
                     f.airline,f.airline_name].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }}
      if (cls && f.classification !== cls) return false;
      if (cab && f.cabin !== cab) return false;
      if ((f.price_eur||0) > px) return false;
      if ((f.final_score||0) < sc) return false;
      if (dir && (f.stops||0) > 0) return false;
      if (reg && f.region !== reg) return false;
      if (ctry && f.country_to !== ctry) return false;
      if (orig && f.origin !== orig) return false;
      if (al) {{
        const aname = (f.airline_name||f.airline||'');
        if (aname !== al) return false;
      }}
      if (mon && (!f.date_out || !f.date_out.startsWith(mon))) return false;
      if (dur) {{
        const n = f.nights;
        if (dur === 'ow' && n !== -1) return false;
        if (dur === 'we' && !(n >= 1 && n <= 3)) return false;
        if (dur === 'wk' && !(n >= 4 && n <= 8)) return false;
        if (dur === '2w' && !(n >= 9 && n <= 16)) return false;
        if (dur === 'lg' && !(n >= 17)) return false;
      }}
      return true;
    }});

    this.sortFil();
    this.updateKPIs();
  }}

  updateKPIs() {{
    const d = this.fil;
    document.getElementById('cnt').textContent = d.length + ' resultados';
    const s = (id,v) => {{ const e=document.getElementById(id); if(e) e.textContent=v; }};
    s('k0', d.filter(x=>x.classification==='CRÍTICO').length);
    s('k1', d.filter(x=>x.classification==='ERROR').length);
    s('k2', d.filter(x=>x.classification==='ANOMALÍA').length);
    s('k3', d.filter(x=>x.classification==='OFERTA').length);
    const biz = d.filter(x=>x.cabin_code===3||x.cabin_code===4);
    s('k4', biz.length ? Math.min(...biz.map(x=>x.price_eur)).toFixed(0)+'€' : '—');
    const avg = d.length ? Math.round(d.reduce((a,x)=>a+(x.savings_eur||0),0)/d.length) : 0;
    s('k5', avg+'€');
  }}

  sort(col, toggle=true) {{
    if (toggle) {{
      if (this.col === col) this.asc = !this.asc;
      else {{ this.col=col; this.asc=false; }}
    }}
    document.querySelectorAll('thead th').forEach(t=>t.classList.remove('sd','sa'));
    const th = document.getElementById('h_'+col);
    if (th) th.classList.add(this.asc?'sa':'sd');
    this.sortFil();
  }}

  sortFil() {{
    const col=this.col, asc=this.asc;
    this.fil.sort((a,b)=>{{
      let va=a[col], vb=b[col];
      if(va==null) va=asc?Infinity:-Infinity;
      if(vb==null) vb=asc?Infinity:-Infinity;
      if(typeof va==='string') va=va.toLowerCase();
      if(typeof vb==='string') vb=vb.toLowerCase();
      return asc?(va>vb?1:-1):(va<vb?1:-1);
    }});
    this.pg=0;
    this.render();
    this.renderPag();
  }}

  render() {{
    const tb = document.getElementById('tbody');
    const nr = document.getElementById('noRes');
    if (!this.fil.length) {{ tb.innerHTML=''; nr.style.display='block'; return; }}
    nr.style.display='none';
    const rows = this.fil.slice(this.pg*PS, (this.pg+1)*PS);
    tb.innerHTML = rows.map(f=>{{
      const cls = f.classification||'';
      const ccls = f.cabin_code===3||f.cabin_code===4 ? 'c-biz':'c-eco';
      const sc = f.final_score||0;
      const sav = (f.savings_eur||0)>0
        ? `<span style="color:var(--green)">-${{(f.savings_eur||0).toFixed(0)}}€ (${{(f.savings_pct||0).toFixed(0)}}%)</span>`
        : '—';
      const stops = f.stops===0?'✈️ Directo':`${{f.stops||0}} esc.`;
      const book = f.booking_url
        ? `<a href="${{f.booking_url}}" target="_blank" class="book-a">Reservar →</a>`
        : '—';
      const nights = f.nights;
      let durTxt = '';
      if (nights === -1) durTxt = '<span class="dur-badge">solo ida</span>';
      else if (nights >= 1 && nights <= 3) durTxt = `<span class="dur-badge">${{nights}}n 🏖️fin sem.</span>`;
      else if (nights >= 4 && nights <= 8) durTxt = `<span class="dur-badge">${{nights}}n 📅1 sem.</span>`;
      else if (nights >= 9 && nights <= 16) durTxt = `<span class="dur-badge">${{nights}}n 🌴15d.</span>`;
      else if (nights >= 17) durTxt = `<span class="dur-badge">${{nights}}n 🗺️largo</span>`;
      const al = f.airline_name||f.airline||'—';
      const title = (f.reasons||[]).join(' | ');
      const ratio = f.biz_ratio;
      const ratioTxt = ratio
        ? `<span style="color:${{ratio<1.5?'var(--green)':ratio<2.5?'var(--yellow)':'var(--text2)'}}">${{ratio.toFixed(1)}}x</span>`
        : '—';
      const cabIcon = f.cabin_code===3?'👑':f.cabin_code===4?'💎':f.cabin_code===2?'🪑':'✈️';
      return `<tr title="${{title}}">
        <td><div class="s-wrap"><div class="s-bar"><div class="s-fill" style="width:${{sc}}%"></div></div><small style="color:var(--text2)">${{sc.toFixed(0)}}</small></div></td>
        <td><span class="pill ${{cls}}">${{cls}}</span></td>
        <td style="font-weight:700">${{f.origin||''}}</td>
        <td style="font-weight:700">${{f.destination||''}}</td>
        <td style="color:var(--text2)">${{f.country_to||'—'}}</td>
        <td style="color:var(--text2)">${{f.region||'—'}}</td>
        <td><span class="${{ccls}}">${{cabIcon}} ${{f.cabin||'economy'}}</span></td>
        <td class="p-eur">${{(f.price_eur||0).toFixed(0)}}€</td>
        <td>${{ratioTxt}}</td>
        <td>${{sav}}</td>
        <td>${{al}}</td>
        <td>${{f.date_out||'—'}}</td>
        <td>${{durTxt}}</td>
        <td>${{stops}}</td>
        <td>${{book}}</td>
      </tr>`;
    }}).join('');
  }}

  renderPag() {{
    const total=this.fil.length, pages=Math.ceil(total/PS), p=this.pg;
    const w=document.getElementById('pag');
    if(pages<=1){{w.innerHTML='';return;}}
    let h=`<span class="pinfo">${{p*PS+1}}–${{Math.min((p+1)*PS,total)}} de ${{total}}</span>`;
    if(p>0) h+=`<button class="pbtn" onclick="D.page(${{p-1}})">←</button>`;
    for(let i=0;i<pages;i++){{
      if(i===0||i===pages-1||Math.abs(i-p)<=1)
        h+=`<button class="pbtn${{i===p?' on':''}}" onclick="D.page(${{i}})">${{i+1}}</button>`;
      else if(Math.abs(i-p)===2) h+=`<span class="pinfo">…</span>`;
    }}
    if(p<pages-1) h+=`<button class="pbtn" onclick="D.page(${{p+1}})">→</button>`;
    w.innerHTML=h;
  }}

  page(n){{this.pg=n;this.render();this.renderPag();document.getElementById('tbl').scrollIntoView({{behavior:'smooth',block:'start'}});}}

  reset(){{
    ['fQ','fPx','fSc'].forEach(id=>document.getElementById(id).value='');
    ['fCls','fCab','fReg','fCtry','fDur','fOrig','fAl','fMon'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('fDirect').checked=false;
    document.getElementById('fCtry').innerHTML='<option value="">Todos los países</option>';
    this.go();
  }}

  csv(){{
    const h=['Score','Tipo','Origen','Dest.','Ciudad','País','Región','Cabina','Precio€','Ahorro€','Ahorro%','Aerolínea','Salida','Vuelta','Noches','Escalas','URL Reserva'];
    const rows=this.fil.map(f=>[
      f.final_score||'',f.classification||'',f.origin||'',f.destination||'',
      f.city_to||'',f.country_to||'',f.region||'',f.cabin||'',
      f.price_eur||'',f.savings_eur||'',f.savings_pct||'',
      f.airline_name||f.airline||'',f.date_out||'',f.date_ret||'',
      f.nights!=-1?f.nights:'OW',f.stops||0,f.booking_url||''
    ]);
    const csv=[h,...rows].map(r=>r.map(v=>`"${{String(v).replace(/"/g,'""')}}"`).join(',')).join('\\n');
    const a=document.createElement('a');
    a.href='data:text/csv;charset=utf-8,\\uFEFF'+encodeURIComponent(csv);
    a.download='flight_hunter_v4.csv'; a.click();
  }}
}}

function toggleDark(){{
  const d=document.documentElement;
  const now=d.getAttribute('data-theme')==='dark';
  d.setAttribute('data-theme',now?'':'dark');
  document.querySelector('.btn-sm').textContent=now?'🌙 Dark':'☀️ Light';
}}

document.getElementById('h_final_score').classList.add('sd');
const D = new Dashboard();
</script>
</body>
</html>"""

    if output_path:
        with open(output_path, "w", encoding="utf-8") as fh:
            fh.write(html)
        print(f"   💾 Dashboard HTML guardado: {output_path}")
    return html


def _build_business_section(analyzed: List[Dict]) -> str:
    """Sección de Business / Premium Economy deals con comparativa B/E."""
    biz_deals = sorted(
        [a for a in analyzed if a.get("cabin_code") in (2, 3, 4)],
        key=lambda x: x.get("biz_ratio") or x.get("t4_ratio") or 99,
    )
    if not biz_deals:
        return ""

    cards_html = []
    for d in biz_deals[:6]:
        price    = d.get("price_eur", 0)
        org      = d.get("origin", "?")
        dst      = d.get("destination", "?")
        cty      = d.get("city_to", dst)
        ctr      = d.get("country_to", "")
        al       = d.get("airline_name") or d.get("airline", "?")
        cab      = d.get("cabin", "business")
        dt       = d.get("date_out", "?")
        bk       = d.get("booking_url", "")
        ratio    = d.get("biz_ratio") or d.get("t4_ratio")
        eco_p    = d.get("biz_eco_price") or d.get("t4_eco_price")
        sc       = d.get("final_score", 0)
        loc      = f"{cty}, {ctr}" if ctr else cty
        cab_icon = "💎" if d.get("cabin_code") == 4 else "👑" if d.get("cabin_code") == 3 else "🪑"

        ratio_html = ""
        if ratio and eco_p:
            color = "var(--green)" if ratio < 1.8 else "var(--yellow)" if ratio < 2.5 else "var(--text2)"
            ratio_html = f'<div style="font-size:.72rem;color:{color};margin-top:4px">Ratio vs Economy: <strong>{ratio:.1f}x</strong> (eco: {eco_p:.0f}€)</div>'
        elif ratio:
            color = "var(--green)" if ratio < 1.8 else "var(--yellow)" if ratio < 2.5 else "var(--text2)"
            ratio_html = f'<div style="font-size:.72rem;color:{color};margin-top:4px">Ratio B/E: <strong>{ratio:.1f}x</strong></div>'

        book_btn = f'<a href="{bk}" target="_blank" class="d-btn">Reservar →</a>' if bk else ""

        cards_html.append(f"""<div class="deal biz">
  <div class="ribbon bz">{cab_icon} {cab.upper()}</div>
  <div class="d-route">{org} → {dst}</div>
  <div style="font-size:.72rem;color:var(--text2)">{loc}</div>
  <div class="d-price">{price:.0f}€</div>
  <div class="d-det">{al} · {dt}<br>Score: {sc:.0f}{ratio_html}</div>
  {book_btn}
</div>""")

    if not cards_html:
        return ""

    return f"""
<div style="padding:4px 24px 2px">
  <div style="font-size:.8rem;font-weight:800;color:var(--text2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">
    👑 Business &amp; Premium Deals — Mejores ratios Business/Economy
  </div>
  <div class="hero" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
    {''.join(cards_html)}
  </div>
</div>"""


def _build_hero_cards(analyzed: List[Dict]) -> str:
    if not analyzed:
        return ""
    cards = []

    def card(deal, label, rc=""):
        p   = deal.get("price_eur", 0)
        org = deal.get("origin", "?")
        dst = deal.get("destination", "?")
        cty = deal.get("city_to", dst)
        ctr = deal.get("country_to", "")
        al  = deal.get("airline_name") or deal.get("airline", "?")
        cab = deal.get("cabin", "Economy")
        dt  = deal.get("date_out", "?")
        st  = deal.get("stops", 0)
        sc  = deal.get("final_score", 0)
        sv  = deal.get("savings_eur", 0)
        sp  = deal.get("savings_pct", 0)
        bk  = deal.get("booking_url", "")
        rt  = deal.get("t4_ratio")
        ni  = deal.get("nights", -1)
        dur = f" · {ni} noches" if ni > 0 else " · Solo ida"
        loc = f"{cty}, {ctr}" if ctr else cty
        ratio_h = f"<br>Ratio B/E: <strong>{rt:.1f}x</strong>" if rt else ""
        sav_h = f"<br><span style='color:var(--green)'>Ahorro: -{sv:.0f}€ ({sp:.0f}%)</span>" if sv > 0 else ""
        bk_h = f'<a href="{bk}" target="_blank" class="d-btn">🔖 Reservar</a>' if bk else ""
        cc = "urg" if deal.get("classification") == "CRÍTICO" else ("biz" if deal.get("cabin_code") in (3,4) else "")
        return f"""<div class="deal {cc}">
  <div class="ribbon {rc}">{label}</div>
  <div class="d-route">{org} → {loc}</div>
  <div class="d-price">{p:.0f}€</div>
  <div class="d-det">{cab} · {al} · {dt}{dur}<br>{'Directo' if st==0 else f'{st} escala(s)'}{ratio_h}{sav_h}<br>Score: {sc:.0f}/100</div>
  {bk_h}
</div>"""

    cards.append(card(analyzed[0], "🏆 MEJOR DEAL"))
    biz = [a for a in analyzed if a.get("cabin_code") in (3, 4)]
    if biz:
        cards.append(card(biz[0], "👑 BUSINESS", "bz"))
    ratio_d = sorted([a for a in analyzed if a.get("t4_ratio") and a.get("t4_triggered")],
                      key=lambda x: x.get("t4_ratio", 99))
    if ratio_d:
        r = ratio_d[0]
        cards.append(card(r, f"💡 RATIO {r.get('t4_ratio',0):.1f}x"))
    crit = [a for a in analyzed if a.get("classification") == "CRÍTICO"]
    if crit and crit[0] != analyzed[0]:
        cards.append(card(crit[0], "🚨 URGENTE"))
    return '<div class="hero">\n' + "\n".join(cards) + "\n</div>"
