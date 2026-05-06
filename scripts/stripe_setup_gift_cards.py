#!/usr/bin/env python3
"""
stripe_setup_gift_cards.py — Crea los 4 productos gift card en Stripe.

Uso:
    export STRIPE_SECRET_KEY=sk_live_...   # tu key real
    python3 scripts/stripe_setup_gift_cards.py

Output: imprime los 4 price_id listos para pegar como Vercel envs:
    STRIPE_PRICE_GIFT_25=price_1...
    STRIPE_PRICE_GIFT_50=price_1...
    STRIPE_PRICE_GIFT_100=price_1...
    STRIPE_PRICE_GIFT_200=price_1...

Idempotente: si ya hay un producto con metadata={kind=gift_card,amount=X}
lo reutiliza en lugar de crear duplicado.
"""
import os
import sys
import urllib.parse
import urllib.request
import json

KEY = os.environ.get("STRIPE_SECRET_KEY", "").strip()
if not KEY or not KEY.startswith(("sk_live_", "sk_test_")):
    sys.exit("❌ Set STRIPE_SECRET_KEY env var (sk_live_... o sk_test_...)")

BASE = "https://api.stripe.com/v1"
AMOUNTS = [25, 50, 100, 200]


def stripe_request(method: str, path: str, params: dict | None = None) -> dict:
    url = f"{BASE}{path}"
    headers = {
        "Authorization": f"Bearer {KEY}",
        "Stripe-Version": "2024-11-20.acacia",
    }
    data = None
    if params:
        data = urllib.parse.urlencode(params, doseq=True).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    if method == "GET" and params:
        url = f"{url}?{urllib.parse.urlencode(params, doseq=True)}"
        data = None
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        sys.exit(f"❌ Stripe API error {e.code}: {body}")


def find_existing_product(amount: int) -> str | None:
    """Search products with metadata kind=gift_card and amount=X."""
    res = stripe_request("GET", "/products", {"limit": 100, "active": "true"})
    for p in res.get("data", []):
        meta = p.get("metadata") or {}
        if meta.get("kind") == "gift_card" and str(meta.get("amount")) == str(amount):
            return p["id"]
    return None


def find_existing_price(product_id: str, amount: int) -> str | None:
    res = stripe_request("GET", "/prices", {"product": product_id, "active": "true", "limit": 10})
    for pr in res.get("data", []):
        if (
            pr.get("currency") == "eur"
            and pr.get("unit_amount") == amount * 100
            and pr.get("type") == "one_time"
        ):
            return pr["id"]
    return None


def ensure_product_and_price(amount: int) -> str:
    """Crea producto + price si no existen. Devuelve price_id."""
    existing_product = find_existing_product(amount)
    if existing_product:
        existing_price = find_existing_price(existing_product, amount)
        if existing_price:
            print(f"  ↳ {amount}€: reutilizando product {existing_product} + price {existing_price}")
            return existing_price
        product_id = existing_product
    else:
        prod = stripe_request(
            "POST",
            "/products",
            {
                "name": f"TripCazador Gift Card {amount}€",
                "description": f"Tarjeta regalo TripCazador de {amount}€ — sin caducidad. Aplica a vuelos, hoteles, tours, eSIM y seguros vía partners afiliados.",
                "metadata[kind]": "gift_card",
                "metadata[amount]": str(amount),
                "tax_code": "txcd_10000000",  # General services - electronically supplied
            },
        )
        product_id = prod["id"]
        print(f"  ↳ {amount}€: creado product {product_id}")

    price = stripe_request(
        "POST",
        "/prices",
        {
            "product": product_id,
            "unit_amount": amount * 100,
            "currency": "eur",
            "metadata[kind]": "gift_card",
            "metadata[amount]": str(amount),
        },
    )
    print(f"      → price {price['id']}")
    return price["id"]


def main():
    print(f"Stripe key: {KEY[:12]}…  (modo {'LIVE' if KEY.startswith('sk_live_') else 'TEST'})")
    print()
    print("Creando productos gift card…")
    ids = {}
    for a in AMOUNTS:
        ids[a] = ensure_product_and_price(a)

    print()
    print("=" * 60)
    print("✅ Listo. Pega estas envs en Vercel (Settings → Environment Variables → Production):")
    print()
    for a in AMOUNTS:
        print(f"STRIPE_PRICE_GIFT_{a}={ids[a]}")
    print()
    print("Tras pegar, dispara un nuevo deploy para que Vercel las recoja.")


if __name__ == "__main__":
    main()
