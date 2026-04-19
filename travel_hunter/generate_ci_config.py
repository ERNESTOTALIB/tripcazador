#!/usr/bin/env python3
"""
Genera config.json a partir de GitHub Secrets (variables de entorno).
Se ejecuta en GitHub Actions antes de la búsqueda.

Secrets necesarios:
  SMTP_EMAIL       - Tu email de Gmail
  SMTP_PASSWORD    - App Password de Gmail
  RECIPIENT_EMAIL  - Donde recibir alertas
  SEARCH_CONFIG    - JSON con las búsquedas (ver ejemplo abajo)

SEARCH_CONFIG debe ser un JSON con este formato:
[
    {
        "name": "Grecia Agosto 2026",
        "flight_params": {
            "origin": "SXB",
            "destination": "ATH",
            "date_depart": "2026-08-01",
            "date_return": "2026-08-15",
            "adults": 4,
            "children": 0,
            "infants_lap": 1,
            "cabin_class": "economy",
            "currency": "EUR"
        },
        "hotel_params": {
            "destination": "Atenas, Grecia",
            "checkin": "2026-08-01",
            "checkout": "2026-08-11",
            "adults": 4,
            "children": 1,
            "children_ages": [1],
            "rooms": 2,
            "currency": "EUR",
            "board_type": "all_inclusive",
            "stars": [4, 5],
            "min_review_score": 8.0
        }
    }
]
"""

import json
import os
import sys


def main():
    smtp_email = os.environ.get("SMTP_EMAIL", "")
    smtp_password = os.environ.get("SMTP_PASSWORD", "")
    recipient_email = os.environ.get("RECIPIENT_EMAIL", "")
    search_config_raw = os.environ.get("SEARCH_CONFIG", "[]")
    tequila_api_key = os.environ.get("TEQUILA_API_KEY", "")

    if not smtp_email or not smtp_password:
        print("⚠️  SMTP_EMAIL o SMTP_PASSWORD no configurados.")
        print("   Las notificaciones por email no funcionarán.")

    if not recipient_email:
        recipient_email = smtp_email  # Enviar a sí mismo

    # Parsear configuración de búsquedas
    try:
        searches = json.loads(search_config_raw)
        if not isinstance(searches, list):
            searches = [searches]
    except json.JSONDecodeError as e:
        print(f"❌ Error parseando SEARCH_CONFIG: {e}")
        print(f"   Valor recibido: {search_config_raw[:200]}...")
        # Usar búsqueda de ejemplo
        searches = [
            {
                "name": "Ejemplo - Edita SEARCH_CONFIG",
                "flight_params": {
                    "origin": "SXB",
                    "destination": "ATH",
                    "date_depart": "2026-08-01",
                    "date_return": "2026-08-15",
                    "adults": 4,
                    "children": 0,
                    "infants_lap": 1,
                    "cabin_class": "economy",
                    "currency": "EUR",
                },
                "hotel_params": None,
            }
        ]

    if tequila_api_key:
        print(f"✅ Tequila API key configurada")
    else:
        print("⚠️  TEQUILA_API_KEY no configurada. Solo se usará scraping.")

    config = {
        "tequila": {
            "api_key": tequila_api_key,
            "enabled": bool(tequila_api_key),
            "flex_days": 3,
        },
        "email": {
            "smtp_server": "smtp.gmail.com",
            "smtp_port": 587,
            "sender_email": smtp_email,
            "sender_password": smtp_password,
            "recipient_email": recipient_email,
        },
        "scraper": {
            "headless": True,
            "slow_mo": 50,  # Más rápido en CI
        },
        "database": {
            "path": "travel_prices.db",
        },
        "monitor": {
            "min_drop_percent_flight": 5.0,
            "min_drop_percent_hotel": 8.0,
            "price_error_threshold": 15.0,
            "airlines_to_check": [
                "ryanair", "easyjet", "vueling", "transavia",
                "lufthansa", "airfrance", "aegean", "turkish",
            ],
        },
        "searches": searches,
    }

    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)

    print(f"✅ config.json generado con {len(searches)} búsqueda(s)")
    for s in searches:
        fp = s.get("flight_params", {})
        hp = s.get("hotel_params")
        print(f"   - {s.get('name', 'Sin nombre')}: "
              f"{fp.get('origin', '?')} → {fp.get('destination', '?')}"
              f"{' + hotel' if hp else ''}")


if __name__ == "__main__":
    main()
