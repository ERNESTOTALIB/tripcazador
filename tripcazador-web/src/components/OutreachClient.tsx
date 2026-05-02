"use client";

import { useState } from "react";
import type { OutreachTemplate } from "@/lib/outreach_templates";
import { renderTemplate } from "@/lib/outreach_templates";

interface Props {
  templates: OutreachTemplate[];
}

const CATEGORY_LABELS: Record<OutreachTemplate["category"], string> = {
  insurance: "Seguros de viaje",
  esim: "eSIM / Conectividad",
  transfer: "Transfers aeropuerto",
  carrental: "Alquiler coche",
  hotels: "Hoteles (afiliados)",
  lounge: "Lounges aeropuerto",
};

export function OutreachClient({ templates }: Props) {
  const [activeId, setActiveId] = useState<string>(templates[0]?.id || "");
  const [brand, setBrand] = useState<string>("");
  const [copied, setCopied] = useState<"subject" | "body" | null>(null);

  const tpl = templates.find((t) => t.id === activeId);
  const rendered = tpl
    ? renderTemplate(tpl, brand || "[NOMBRE MARCA]")
    : { subject: "", body: "" };

  const copy = async (text: string, kind: "subject" | "body") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* no-op */
    }
  };

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      <aside className="bg-gray-900 border border-gray-800 rounded-lg p-4 h-fit lg:sticky lg:top-20">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">
          Categorías ({templates.length})
        </h2>
        <ul className="space-y-1">
          {templates.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setActiveId(t.id)}
                className={`w-full text-left text-sm px-3 py-2 rounded transition-colors ${
                  activeId === t.id
                    ? "bg-amber-500/15 text-amber-300 border border-amber-700/50"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                <span className="block font-medium">{CATEGORY_LABELS[t.category]}</span>
                <span className="text-xs text-gray-500 mt-0.5 block truncate">
                  Ejemplos: {t.brand_examples.slice(0, 2).join(", ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        {!tpl ? (
          <p className="text-gray-500">Selecciona una categoría.</p>
        ) : (
          <>
            <div className="mb-4">
              <label
                htmlFor="brand-input"
                className="block text-xs font-semibold text-gray-300 mb-2"
              >
                Nombre de la marca (reemplaza {"{{brand_name}}"})
              </label>
              <input
                id="brand-input"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder={`Ej: ${tpl.brand_examples[0]}`}
                className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                Ideas marcas {CATEGORY_LABELS[tpl.category]}: {tpl.brand_examples.join(", ")}
              </p>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-300" htmlFor="subject-out">
                  Asunto
                </label>
                <button
                  type="button"
                  onClick={() => copy(rendered.subject, "subject")}
                  className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded"
                >
                  {copied === "subject" ? "✓ Copiado" : "Copiar asunto"}
                </button>
              </div>
              <textarea
                id="subject-out"
                readOnly
                value={rendered.subject}
                className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-sm font-mono leading-relaxed resize-none"
                rows={2}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-300" htmlFor="body-out">
                  Cuerpo del email
                </label>
                <button
                  type="button"
                  onClick={() => copy(rendered.body, "body")}
                  className="text-xs px-2 py-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded"
                >
                  {copied === "body" ? "✓ Copiado" : "Copiar cuerpo"}
                </button>
              </div>
              <textarea
                id="body-out"
                readOnly
                value={rendered.body}
                className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-sm font-mono leading-relaxed"
                rows={28}
              />
            </div>

            <p className="text-xs text-gray-500 mt-4">
              💡 Después de enviar, revisa contacto@tripcazador.com (llega a
              ernestalib@hotmail.com via Cloudflare Email Routing) — las
              respuestas suelen llegar en 1-7 días.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
