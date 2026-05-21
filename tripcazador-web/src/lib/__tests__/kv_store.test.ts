/**
 * kv_store.test.ts — SSS388
 *
 * Tests sin red — InMemoryKV fallback path. Upstash path no testeado
 * (necesita env vars + URL real). Coverage del fallback es suficiente
 * para anti-regresión.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createKV, __resetKVForTests } from "../kv_store";

beforeEach(() => __resetKVForTests());

describe("InMemoryKV factory", () => {
  it("crea store con namespace + isPersistent=false (sin env Upstash)", () => {
    const s = createKV("test");
    expect(s.namespace).toBe("test");
    expect(s.isPersistent).toBe(false);
  });

  it("get/set roundtrip string", async () => {
    const s = createKV("a");
    await s.set("k1", "hello");
    expect(await s.get("k1")).toBe("hello");
  });

  it("get/set roundtrip object", async () => {
    const s = createKV("b");
    await s.set("k1", { foo: 1, bar: "x" });
    const r = await s.get<{ foo: number; bar: string }>("k1");
    expect(r?.foo).toBe(1);
    expect(r?.bar).toBe("x");
  });

  it("get null cuando key no existe", async () => {
    const s = createKV("c");
    expect(await s.get("missing")).toBeNull();
  });

  it("del elimina key", async () => {
    const s = createKV("d");
    await s.set("k", 1);
    expect(await s.del("k")).toBe(true);
    expect(await s.get("k")).toBeNull();
  });

  it("incr suma con default 1", async () => {
    const s = createKV("e");
    expect(await s.incr("counter")).toBe(1);
    expect(await s.incr("counter")).toBe(2);
    expect(await s.incr("counter", 5)).toBe(7);
  });

  it("ttlSeconds expira el valor", async () => {
    const s = createKV("f");
    // TTL muy corto
    await s.set("temp", "val", 0.001); // 1ms
    await new Promise((r) => setTimeout(r, 50));
    expect(await s.get("temp")).toBeNull();
  });

  it("scan retorna keys con prefix", async () => {
    const s = createKV("g");
    await s.set("user:1", "a");
    await s.set("user:2", "b");
    await s.set("admin:1", "c");
    const users = await s.scan("user:", 100);
    expect(users.sort()).toEqual(["user:1", "user:2"]);
  });

  it("scan respeta limit", async () => {
    const s = createKV("h");
    for (let i = 0; i < 10; i++) await s.set(`item:${i}`, i);
    const r = await s.scan("item:", 3);
    expect(r.length).toBe(3);
  });

  it("size cuenta keys", async () => {
    const s = createKV("i");
    await s.set("a", 1);
    await s.set("b", 2);
    expect(await s.size()).toBe(2);
  });

  it("namespaces aislados", async () => {
    const a = createKV("ns_a");
    const b = createKV("ns_b");
    await a.set("k", "from_a");
    await b.set("k", "from_b");
    expect(await a.get("k")).toBe("from_a");
    expect(await b.get("k")).toBe("from_b");
  });

  it("factory cachea por namespace (mismo objeto)", () => {
    const s1 = createKV("cache_test");
    const s2 = createKV("cache_test");
    expect(s1).toBe(s2);
  });
});
