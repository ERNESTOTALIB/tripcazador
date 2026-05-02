"use client";

import { useMemo, useState } from "react";
import type { ShareTemplate, ShareableContent } from "@/lib/share_templates";
import { renderShare, templatesForContent } from "@/lib/share_templates";

interface Props {
  content: ShareableContent[];
  templates: ShareTemplate[];
}

const PLATFORM_LABELS: Record<ShareTemplate["platform"], { label: string; icon: string; color: string }> = {
  reddit: { label: "Reddit", icon: "🟠", color: "bg-orange-600/15 text-orange-300 border-orange-700/50" },
  twitter: { label: "Twitter / X", icon: "🐦", color: "bg-sky-600/15 text-sky-300 border-sky-700/50" },
  facebook: { label: "Facebook", icon: "🔵", color: "bg-blue-600/15 text-blue-300 border-blue-700/50" },
  threads: { label: "Threads", icon: "🧵", color: "bg-purple-600/15 text-purple-300 border-purple-700/50" },
  whatsapp: { label: "WhatsApp", icon: "🟢", color: "bg-green-600/15 text-green-300 border-green-700/50" },
};

const TYPE_LABELS: Record<ShareableContent["type"], string> = {
  blog_post: "📰 Blog",
  calculator: "🧮 Calculadora",
  comparison: "⚖️ Comparativa",
  destination: "📍 Destino",
  homepage: "🏠 Home/Hubs",
};

export function ShareKit({ content, templates }: Props) {
  const [activeContentId, setActiveContentId] = useState<string>(content[0]?.id || "");
  const [activeTemplateId, setActiveTemplateId] = useState<string>("");
  const [copied, setCopied] = useState<"title" | "body" | "all" | null>(null);

  const activeContent = content.find((c) => c.id === activeContentId);
  const availableTemplates = useMemo(
    () => (activeContent ? templatesForContent(activeContent) : []),
    [activeContent],
  );

  // Auto-select first available template when content changes
  const currentTemplateId =
    activeTemplateId && availableTemplates.find((t) => t.id === activeTemplateId)
      ? activeTemplateId
      : availableTemplates[0]?.id || "";

  const activeTemplate = templates.find((t) => t.id === currentTemplateId);
  const rendered =
    activeContent && activeTemplate
      ? renderShare(activeTemplate, activeContent)
      : { title: "", body: "", url: "" };

  const copy = async (text: string, kind: "title" | "body" | "all") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* no-op */
    }
  };

  // Group content by type
  const grouped = content.reduce<Record<string, ShareableContent[]>>((acc, c) => {
    if (!acc[c.type]) acc[c.type] = [];
    acc[c.type].push(c);
    return acc;
  }, {});

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-6">
      <aside className="bg-gray-900 border border-gray-800 rounded-lg p-4 h-fit lg:sticky lg:top-20 max-h-[80vh] overflow-y-auto">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">
          Contenido a compartir
        </h2>
        {Object.entries(grouped).map(([type, items]) => (
          <div key={type} className="mb-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">
              {TYPE_LABELS[type as ShareableContent["type"]]}
            </div>
            <ul className="space-y-1">
              {items.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveContentId(c.id);
                      setActiveTemplateId("");
                    }}
                    className={`w-full text-left text-sm px-2.5 py-1.5 rounded transition-colors ${
                      activeContentId === c.id
                        ? "bg-amber-500/15 text-amber-300 border border-amber-700/50"
                        : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    }`}
                  >
                    {c.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        {!activeContent || !activeTemplate ? (
          <p className="text-gray-500">Selecciona un contenido a compartir.</p>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">URL</p>
              <p className="text-sm text-amber-400 break-all">{rendered.url}</p>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-300 mb-2">Plataforma</p>
              <div className="flex flex-wrap gap-2">
                {availableTemplates.map((t) => {
                  const meta = PLATFORM_LABELS[t.platform];
                  const active = t.id === currentTemplateId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTemplateId(t.id)}
                      className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                        active
                          ? meta.color
                          : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700"
                      }`}
                    >
                      <span className="mr-1.5">{meta.icon}</span>
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeTemplate.platform === "reddit" && activeTemplate.subreddit_targets && (
              <div className="mb-4 p-3 bg-orange-500/5 border border-orange-700/30 rounded">
                <p className="text-xs font-semibold text-orange-300 mb-1.5">
                  Subreddits sugeridos
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {activeTemplate.subreddit_targets.map((sr) => (
                    <a
                      key={sr}
                      href={`https://reddit.com/r/${sr}/submit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-0.5 bg-orange-500/10 text-orange-300 rounded hover:bg-orange-500/20"
                    >
                      r/{sr}
                    </a>
                  ))}
                </div>
                <p className="text-xs text-orange-300/80 mt-2">
                  ⚠️ Consejo: postea valor primero. Si tu primer post en un sub
                  es solo un link, te baneará el mod. Mejor: post completo con
                  análisis copiado del blog + link al final como referencia.
                </p>
              </div>
            )}

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-300">Título / Subject</p>
                <button
                  type="button"
                  onClick={() => copy(rendered.title, "title")}
                  className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded"
                >
                  {copied === "title" ? "✓ Copiado" : "Copiar título"}
                </button>
              </div>
              <textarea
                readOnly
                value={rendered.title}
                rows={2}
                className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-sm font-mono leading-relaxed resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-300">Cuerpo</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => copy(rendered.body, "body")}
                    className="text-xs px-2 py-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded"
                  >
                    {copied === "body" ? "✓ Copiado" : "Copiar cuerpo"}
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(`${rendered.title}\n\n${rendered.body}`, "all")}
                    className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded"
                  >
                    {copied === "all" ? "✓ Copiado" : "Copiar todo"}
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={rendered.body}
                rows={20}
                className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-sm font-mono leading-relaxed"
              />
            </div>

            <div className="mt-6 p-3 bg-blue-500/5 border border-blue-700/30 rounded text-xs text-blue-300/90">
              💡 <strong>Tip de distribución:</strong>{" "}
              Reddit funciona si das valor real (no link spam). Twitter funciona
              con hilo + datos visibles. Facebook funciona en grupos relevantes
              (no en feed general). WhatsApp/Threads para amigos cercanos.
              <br />
              Las primeras 100-500 visitas reales suelen venir de 5-10 posts
              bien hechos en Reddit + 1-2 hilos virales en Twitter.
            </div>
          </>
        )}
      </section>
    </div>
  );
}
