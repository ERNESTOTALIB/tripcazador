"use client";
/**
 * ConciergeSuccessCleanup — SSS423 (23 may 2026)
 *
 * Client component invisible que limpia la cookie de abandonment
 * cuando user llega a /concierge/success (pago confirmado).
 *
 * Sin esto la cookie seguiría 24h aunque ya completó, mostrando el
 * banner de recovery indebido.
 */
import { useEffect } from "react";
import { clearConciergeAbandonment } from "@/lib/concierge_abandonment";

export function ConciergeSuccessCleanup() {
  useEffect(() => {
    clearConciergeAbandonment();
  }, []);
  return null;
}

export default ConciergeSuccessCleanup;
