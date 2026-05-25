#!/usr/bin/env node
/**
 * generate_weekly_blog.mjs — SUPER-SPONSORS (25 may 2026)
 *
 * Genera un post MDX semanal con los top-5 chollos más baratos
 * extraídos de /api/deals (PROD). Output se commit auto via workflow
 * .github/workflows/weekly-deals-blog.yml.
 *
 * Usage:
 *   DEALS_API_URL=https://tripcazador.com/api/deals \
 *   OUTPUT_DIR=src/content/blog \
 *   node scripts/generate_weekly_blog.mjs
 *
 * Output:
 *   $OUTPUT_DIR/weekly-deals-YYYY-WW.mdx
 *
 * Si el archivo ya existe (re-run mismo domingo), skip.
 * Si la API falla, exit 0 sin commit (no rompe el workflow).
 *
 * GH Outputs:
 *   created=true|false  filename=...
 */
import fs from "node:fs/promises";
import path from "node:path";

const DEALS_API_URL =
  process.env.DEALS_API_URL || "https://tripcazador.com/api/deals";
const OUTPUT_DIR = process.env.OUTPUT_DIR || "src/content/blog";
const TOP_N = 5;

function ghOutput(key, value) {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) {
    console.log(`[ghOutput] ${key}=${value}`);
    return;
  }
  fs.appendFile(file, `${key}=${value}\n`).catch(() => {});
}

function isoWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week: weekNo };
}

function priceFmt(d) {
  if (typeof d.price_eur === "number") return `${d.price_eur.toFixed(0)} €`;
  if (typeof d.price === "number") return `${d.price.toFixed(0)} €`;
  return "—";
}

function originFmt(d) {
  return d.origin_city || d.origin || d.from || "?";
}
function destinationFmt(d) {
  return d.destination_city || d.destination || d.to || "?";
}
function airlineFmt(d) {
  return d.airline || d.carrier || "?";
}

async function fetchDeals() {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const res = await fetch(DEALS_API_URL, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const arr = Array.isArray(data) ? data : data.deals || data.data || [];
    return arr;
  } finally {
    clearTimeout(t);
  }
}

function pickTopCheap(deals) {
  return [...deals]
    .filter((d) => typeof (d.price_eur ?? d.price) === "number")
    .sort((a, b) => (a.price_eur ?? a.price) - (b.price_eur ?? b.price))
    .slice(0, TOP_N);
}

function mdxBody({ year, week, deals }) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const title = `Top ${deals.length} chollos vuelos semana ${week}/${year}`;
  const description = `Recopilación semanal: los ${deals.length} vuelos más baratos detectados por TripCazador del ${dateStr}. Precios ida-vuelta desde España.`;

  const dealRows = deals
    .map((d, i) => {
      const o = originFmt(d);
      const x = destinationFmt(d);
      const a = airlineFmt(d);
      const p = priceFmt(d);
      const id = d.id || d.uuid || "";
      const url = id ? `/deals/${id}` : null;
      return `${i + 1}. **${o} → ${x}** — ${p} con ${a}${
        url ? ` ([ver detalle](${url}))` : ""
      }`;
    })
    .join("\n");

  return `---
title: "${title}"
description: "${description}"
date: "${dateStr}"
slug: "weekly-deals-${year}-${String(week).padStart(2, "0")}"
tags: [chollos, semanal, ofertas]
auto_generated: true
---

# ${title}

> Generado automáticamente cada domingo · datos en tiempo real /api/deals · ${dateStr}

Cada semana TripCazador escanea decenas de miles de combinaciones origen-destino-fecha. Aquí los **${deals.length} más baratos** detectados esta semana.

## Top ${deals.length} esta semana

${dealRows}

## ¿Cómo encontramos estos precios?

Nuestros _hunters_ ejecutan scans cada 2-3h en Skyscanner, Aviasales y proveedores directos de aerolíneas low-cost. Cuando un precio cae más de **30% respecto a la media histórica** lo marcamos como "chollo" y entra al feed público.

## Recibir alertas antes que nadie

[Subscríbete al newsletter gratuito](/) o pásate a [Premium €9.99/mes](/premium) para alertas en tiempo real cuando aparezca tu ruta + filtros personalizados.

---

_Este post se genera automáticamente cada domingo. Los precios son los detectados en el momento de la generación — pueden cambiar. Verifica antes de reservar._
`;
}

async function main() {
  const now = new Date();
  const { year, week } = isoWeek(now);
  const filename = `weekly-deals-${year}-${String(week).padStart(2, "0")}.mdx`;
  const outPath = path.resolve(OUTPUT_DIR, filename);

  // Skip si ya existe (idempotency)
  try {
    await fs.access(outPath);
    console.log(`[skip] ${outPath} already exists`);
    ghOutput("created", "false");
    ghOutput("filename", filename);
    return;
  } catch {
    /* not exists — proceed */
  }

  let deals = [];
  try {
    const all = await fetchDeals();
    deals = pickTopCheap(all);
  } catch (e) {
    console.error(`[error] fetch deals: ${e.message}`);
    ghOutput("created", "false");
    return; // no commit
  }

  if (deals.length === 0) {
    console.warn("[warn] no deals — skipping post generation");
    ghOutput("created", "false");
    return;
  }

  const body = mdxBody({ year, week, deals });
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, body, "utf8");
  console.log(`[ok] wrote ${outPath} (${deals.length} deals)`);
  ghOutput("created", "true");
  ghOutput("filename", filename);
}

main().catch((e) => {
  console.error(`[fatal] ${e.message}`);
  process.exit(0); // exit 0 so workflow doesn't fail catastrophically
});
