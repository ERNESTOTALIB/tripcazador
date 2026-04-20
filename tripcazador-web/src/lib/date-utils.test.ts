/**
 * Tests para los helpers de fecha de la UI.
 *
 * Cubrimos específicamente el bug que motivó la extracción: mezclar
 * `new Date(iso)` (UTC) con `getDate()`/`toISOString()` produce fechas
 * incorrectas en zonas horarias no-UTC. Estas pruebas se ejecutan en el
 * timezone del runner (UTC en CI), pero validan el invariante "round-trip
 * ISO local → Date → ISO local" que debe cumplirse en cualquier TZ.
 */

import { describe, it, expect } from "vitest";
import {
  toLocalISO,
  parseLocalISO,
  shiftLocalISO,
  percentileSorted,
} from "./date-utils";

describe("toLocalISO", () => {
  it("formatea en YYYY-MM-DD con padding", () => {
    const d = new Date(2026, 0, 3); // 3 enero 2026 local
    expect(toLocalISO(d)).toBe("2026-01-03");
  });

  it("usa componentes locales (no UTC)", () => {
    // 1 enero 2026 00:00 local. En TZ UTC-5 esto sería "2025-12-31 19:00"
    // UTC, cuyo toISOString().slice(0,10) daría "2025-12-31".
    const d = new Date(2026, 0, 1);
    expect(toLocalISO(d)).toBe("2026-01-01");
  });

  it("funciona para los bordes del calendario Gregoriano", () => {
    expect(toLocalISO(new Date(2026, 11, 31))).toBe("2026-12-31");
    expect(toLocalISO(new Date(2000, 1, 29))).toBe("2000-02-29"); // bisiesto
  });
});

describe("parseLocalISO", () => {
  it("devuelve un Date con la hora a 00:00 local", () => {
    const d = parseLocalISO("2026-04-20");
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(3);
    expect(d!.getDate()).toBe(20);
    expect(d!.getHours()).toBe(0);
  });

  it("devuelve null para cadenas mal formadas", () => {
    expect(parseLocalISO("20-04-2026")).toBeNull();
    expect(parseLocalISO("2026/04/20")).toBeNull();
    expect(parseLocalISO("not-a-date")).toBeNull();
    expect(parseLocalISO("")).toBeNull();
    expect(parseLocalISO("2026-04")).toBeNull();
  });

  // Nota: Date autocorrige meses/días fuera de rango (ej. month=13 → +1 año).
  // No es el comportamiento ideal pero es consistente y documentado.
});

describe("shiftLocalISO", () => {
  it("suma días positivos sin cruzar mes", () => {
    expect(shiftLocalISO("2026-04-10", 5)).toBe("2026-04-15");
  });

  it("resta días (offsets negativos)", () => {
    expect(shiftLocalISO("2026-04-10", -3)).toBe("2026-04-07");
  });

  it("cruza límites de mes", () => {
    expect(shiftLocalISO("2026-04-29", 5)).toBe("2026-05-04");
    expect(shiftLocalISO("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("cruza límites de año", () => {
    expect(shiftLocalISO("2026-12-30", 5)).toBe("2027-01-04");
    expect(shiftLocalISO("2026-01-02", -3)).toBe("2025-12-30");
  });

  it("es la identidad para offset 0", () => {
    expect(shiftLocalISO("2026-04-20", 0)).toBe("2026-04-20");
  });

  it("devuelve el input si es inválido", () => {
    expect(shiftLocalISO("bad", 5)).toBe("bad");
  });

  it("maneja correctamente el año bisiesto", () => {
    expect(shiftLocalISO("2024-02-28", 1)).toBe("2024-02-29");
    expect(shiftLocalISO("2024-02-29", 1)).toBe("2024-03-01");
    expect(shiftLocalISO("2025-02-28", 1)).toBe("2025-03-01"); // 2025 no bisiesto
  });

  it("el round-trip shift(-n) ∘ shift(n) = identity", () => {
    for (const iso of ["2026-01-01", "2026-04-20", "2026-12-31"]) {
      for (const n of [1, 3, 7, 30]) {
        expect(shiftLocalISO(shiftLocalISO(iso, n), -n)).toBe(iso);
      }
    }
  });
});

describe("percentileSorted", () => {
  it("devuelve 0 para array vacío", () => {
    expect(percentileSorted([], 50)).toBe(0);
  });

  it("devuelve el único elemento si length=1", () => {
    expect(percentileSorted([42], 0)).toBe(42);
    expect(percentileSorted([42], 50)).toBe(42);
    expect(percentileSorted([42], 100)).toBe(42);
  });

  it("devuelve extremos correctos", () => {
    const arr = [10, 20, 30, 40, 50];
    expect(percentileSorted(arr, 0)).toBe(10);
    expect(percentileSorted(arr, 100)).toBe(50);
  });

  it("interpola entre elementos", () => {
    // [10, 20, 30, 40, 50], p=50 → idx=2 → 30 (exacto)
    expect(percentileSorted([10, 20, 30, 40, 50], 50)).toBe(30);
    // p=25 → idx=1.0 → 20
    expect(percentileSorted([10, 20, 30, 40, 50], 25)).toBe(20);
    // p=75 → idx=3.0 → 40
    expect(percentileSorted([10, 20, 30, 40, 50], 75)).toBe(40);
  });

  it("interpolación lineal en índices fraccionales", () => {
    // [10, 20], p=50 → idx=0.5 → 10*0.5 + 20*0.5 = 15
    expect(percentileSorted([10, 20], 50)).toBe(15);
    // [0, 100], p=33 → idx=0.33 → 33
    expect(percentileSorted([0, 100], 33)).toBeCloseTo(33, 5);
  });

  it("p33 < p66 en datasets realistas", () => {
    const prices = [80, 120, 150, 200, 250, 320, 400, 480, 550, 600];
    const p33 = percentileSorted(prices, 33);
    const p66 = percentileSorted(prices, 66);
    expect(p33).toBeLessThan(p66);
  });
});
