/**
 * share_templates.test.ts — verifica integridad de los templates de share.
 */
import { describe, it, expect } from "vitest";
import {
  SHARE_TEMPLATES,
  TOP_CONTENT,
  renderShare,
  templatesForContent,
} from "../share_templates";

describe("SHARE_TEMPLATES — estructura", () => {
  it("contiene al menos 5 templates", () => {
    expect(SHARE_TEMPLATES.length).toBeGreaterThanOrEqual(5);
  });

  it("todos los ids son únicos", () => {
    const ids = SHARE_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todos tienen platform válida", () => {
    const valid = ["reddit", "twitter", "facebook", "threads", "whatsapp"];
    SHARE_TEMPLATES.forEach((t) => {
      expect(valid).toContain(t.platform);
    });
  });

  it("todos tienen body no vacío", () => {
    SHARE_TEMPLATES.forEach((t) => {
      expect(t.body.length).toBeGreaterThan(20);
    });
  });

  it("todos tienen context válido", () => {
    const valid = ["blog_post", "calculator", "comparison", "destination", "homepage"];
    SHARE_TEMPLATES.forEach((t) => {
      expect(valid).toContain(t.context);
    });
  });

  it("reddit templates tienen subreddit_targets", () => {
    SHARE_TEMPLATES.filter((t) => t.platform === "reddit").forEach((t) => {
      expect(t.subreddit_targets?.length ?? 0).toBeGreaterThan(0);
    });
  });

  it("incluye al menos un template por plataforma principal", () => {
    const platforms = new Set(SHARE_TEMPLATES.map((t) => t.platform));
    expect(platforms.has("reddit")).toBe(true);
    expect(platforms.has("twitter")).toBe(true);
  });
});

describe("TOP_CONTENT", () => {
  it("contiene al menos 5 entradas", () => {
    expect(TOP_CONTENT.length).toBeGreaterThanOrEqual(5);
  });

  it("todas tienen url_path empezando por /", () => {
    TOP_CONTENT.forEach((c) => {
      expect(c.url_path).toMatch(/^\//);
    });
  });

  it("ids únicos", () => {
    const ids = TOP_CONTENT.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todos tienen title", () => {
    TOP_CONTENT.forEach((c) => {
      expect(c.title.length).toBeGreaterThan(0);
    });
  });
});

describe("renderShare", () => {
  const tpl = SHARE_TEMPLATES[0];
  const sample = TOP_CONTENT[0];

  it("reemplaza {{title}} y {{url}}", () => {
    const out = renderShare(tpl, sample);
    expect(out.url).toContain(sample.url_path);
    expect(out.url).toContain("tripcazador.com");
  });

  it("siteUrl custom respetado", () => {
    const out = renderShare(tpl, sample, "https://staging.example.com");
    expect(out.url).toContain("staging.example.com");
  });

  it("body no contiene tokens sin reemplazar {{...}}", () => {
    const out = renderShare(tpl, sample);
    // After templating no debe quedar {{title}} ni {{url}}
    expect(out.body).not.toMatch(/\{\{title\}\}/);
    expect(out.body).not.toMatch(/\{\{url\}\}/);
  });
});

describe("templatesForContent", () => {
  it("devuelve templates compatibles con el tipo", () => {
    const blogContent = TOP_CONTENT.find((c) => c.type === "blog_post");
    if (blogContent) {
      const r = templatesForContent(blogContent);
      expect(r.length).toBeGreaterThan(0);
      r.forEach((t) => {
        expect(["blog_post", "homepage"]).toContain(t.context);
      });
    }
  });
});
