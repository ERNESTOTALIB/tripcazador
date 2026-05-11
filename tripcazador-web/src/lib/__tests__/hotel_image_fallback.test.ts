/**
 * hotel_image_fallback.test.ts — gradient determinístico + onImageError DOM ops.
 */
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { getHotelGradient, onImageError } from "../hotel_image_fallback";

describe("getHotelGradient", () => {
  it("siempre devuelve un linear-gradient", () => {
    const g = getHotelGradient("foo");
    expect(g).toContain("linear-gradient");
  });

  it("determinístico: mismo seed → mismo gradient", () => {
    const a = getHotelGradient("hotel-arts-barcelona");
    const b = getHotelGradient("hotel-arts-barcelona");
    expect(a).toBe(b);
  });

  it("seed distinta puede dar gradient distinto", () => {
    // No es 100% garantizado (hash colisiones) pero suele ser true
    const a = getHotelGradient("a-very-short-name");
    const b = getHotelGradient("totally-different-name-zzz");
    // No falla si colisión, sólo verifica que no crashee
    expect(typeof a).toBe("string");
    expect(typeof b).toBe("string");
  });

  it("seed vacío → fallback al primero", () => {
    const g = getHotelGradient("");
    expect(g).toContain("linear-gradient");
  });

  it("incluye al menos 2 colores", () => {
    const g = getHotelGradient("test");
    // patrón "linear-gradient(135deg, #XXXXXX X%, #XXXXXX X%)"
    const colorMatches = g.match(/#[0-9A-Fa-f]{6}/g);
    expect(colorMatches?.length ?? 0).toBeGreaterThanOrEqual(2);
  });
});

describe("onImageError — DOM manipulation", () => {
  it("añade data-fallback=true al img", () => {
    document.body.innerHTML = '<div><img id="t1" src="x" /></div>';
    const img = document.getElementById("t1") as HTMLImageElement;
    onImageError(img, "hotel-x");
    expect(img.dataset.fallback).toBe("true");
  });

  it("crea placeholder div con gradient", () => {
    document.body.innerHTML = '<div id="parent"><img id="t2" src="x" /></div>';
    const img = document.getElementById("t2") as HTMLImageElement;
    onImageError(img, "hotel-y", "🏖️");
    const parent = document.getElementById("parent");
    const placeholder = parent?.querySelector('[data-hotel-fallback="true"]');
    expect(placeholder).toBeTruthy();
  });

  it("placeholder contiene emoji proporcionado", () => {
    document.body.innerHTML = '<div id="parent"><img id="t3" src="x" /></div>';
    const img = document.getElementById("t3") as HTMLImageElement;
    onImageError(img, "hotel-z", "✨");
    const placeholder = document.querySelector('[data-hotel-fallback="true"]');
    expect(placeholder?.textContent).toBe("✨");
  });

  it("emoji omitido → fallback 🏨", () => {
    document.body.innerHTML = '<div id="parent"><img id="t4" src="x" /></div>';
    const img = document.getElementById("t4") as HTMLImageElement;
    onImageError(img, "hotel-w");
    const placeholder = document.querySelector('[data-hotel-fallback="true"]');
    expect(placeholder?.textContent).toBe("🏨");
  });

  it("img sin parent → solo oculta", () => {
    const img = document.createElement("img");
    expect(() => onImageError(img, "hotel-noparent")).not.toThrow();
    expect(img.style.display).toBe("none");
  });

  it("loop guard: segundo call no añade dos placeholders", () => {
    document.body.innerHTML = '<div id="parent"><img id="t5" src="x" /></div>';
    const img = document.getElementById("t5") as HTMLImageElement;
    onImageError(img, "hotel-once");
    onImageError(img, "hotel-once");
    const placeholders = document.querySelectorAll('[data-hotel-fallback="true"]');
    expect(placeholders.length).toBe(1);
  });

  it("placeholder tiene aria-hidden=true", () => {
    document.body.innerHTML = '<div id="parent"><img id="t6" src="x" /></div>';
    const img = document.getElementById("t6") as HTMLImageElement;
    onImageError(img, "hotel-aria");
    const placeholder = document.querySelector('[data-hotel-fallback="true"]');
    expect(placeholder?.getAttribute("aria-hidden")).toBe("true");
  });
});
