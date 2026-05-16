"use client";

/**
 * NewsletterABWidget — SSS256 (16 may 2026)
 *
 * Switcher A/B newsletter_widget_v1:
 *  - A = NewsletterSignup (inline form)
 *  - B = NewsletterRibbon (CTA banner)
 *
 * Renderizado client-side (A/B requiere localStorage + consent gate).
 * Pre-hydration default = variante A (forma actual) para evitar layout shift.
 */
import { useEffect, useState } from "react";
import { getVariant } from "@/lib/ab";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { NewsletterRibbon } from "@/components/NewsletterRibbon";

interface Props {
  /** Contexto attribution (ej. "blog-post-marrakech", "destino-bali"). */
  context?: string;
}

export function NewsletterABWidget({ context = "site" }: Props) {
  // Default a "A" pre-hydration; el switch B sucede tras useEffect.
  // Esto evita layout shift visible y mantiene el SSR HTML estable.
  const [variant, setVariant] = useState<"A" | "B">("A");

  useEffect(() => {
    const v = getVariant("newsletter_widget_v1");
    setVariant(v);
  }, []);

  if (variant === "B") {
    return <NewsletterRibbon context={context} />;
  }
  return <NewsletterSignup context={context} variant="compact" />;
}
