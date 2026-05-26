import { describe, it, expect } from "vitest";
import { wrapOutboundLinkWith } from "@/lib/outbound_link";

describe("wrapOutboundLink", () => {
  const SID = "12345X";

  it("passthrough cuando no SkimlinksId", () => {
    expect(wrapOutboundLinkWith("https://example.com", {})).toBe(
      "https://example.com",
    );
    expect(wrapOutboundLinkWith("https://example.com", { skimlinksId: "" })).toBe(
      "https://example.com",
    );
  });

  it("passthrough en dominios afiliados directos", () => {
    expect(
      wrapOutboundLinkWith("https://www.amazon.es/dp/B0XYZ", { skimlinksId: SID }),
    ).toBe("https://www.amazon.es/dp/B0XYZ");
    expect(
      wrapOutboundLinkWith("https://booking.com/hotel/x", { skimlinksId: SID }),
    ).toBe("https://booking.com/hotel/x");
    expect(
      wrapOutboundLinkWith("https://aviasales.com/search", { skimlinksId: SID }),
    ).toBe("https://aviasales.com/search");
    expect(
      wrapOutboundLinkWith("https://holafly.com/esim", { skimlinksId: SID }),
    ).toBe("https://holafly.com/esim");
  });

  it("passthrough en dominios excluidos (wikipedia, gov)", () => {
    expect(
      wrapOutboundLinkWith("https://en.wikipedia.org/wiki/Travel", {
        skimlinksId: SID,
      }),
    ).toBe("https://en.wikipedia.org/wiki/Travel");
    expect(
      wrapOutboundLinkWith("https://iata.org/codes", { skimlinksId: SID }),
    ).toBe("https://iata.org/codes");
  });

  it("wraps dominios genéricos retailer via Skimlinks", () => {
    const wrapped = wrapOutboundLinkWith(
      "https://www.elcorteingles.es/maletas/p/123",
      { skimlinksId: SID },
    );
    expect(wrapped).toContain("go.skimresources.com");
    expect(wrapped).toContain(`id=${SID}`);
    expect(wrapped).toContain(encodeURIComponent("https://www.elcorteingles.es/maletas/p/123"));
  });

  it("URL inválida passthrough sin crash", () => {
    expect(wrapOutboundLinkWith("not-a-url", { skimlinksId: SID })).toBe(
      "not-a-url",
    );
    expect(wrapOutboundLinkWith("", { skimlinksId: SID })).toBe("");
  });
});
