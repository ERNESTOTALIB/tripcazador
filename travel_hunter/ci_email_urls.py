#!/usr/bin/env python3
"""
Travel Hunter CI - Envía email solo con URLs (modo ligero, sin scraping).
Útil cuando el scraping falla consistentemente o para ahorrar minutos de CI.
"""

import json
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from url_generator import URLGenerator
from notifier import EmailNotifier


def main():
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
    if not os.path.exists(config_path):
        print("❌ config.json no encontrado")
        sys.exit(1)

    with open(config_path) as f:
        config = json.load(f)

    searches = config.get("searches", [])
    email_cfg = config.get("email", {})
    airlines = config.get("monitor", {}).get("airlines_to_check", [])

    notifier = EmailNotifier(
        smtp_server=email_cfg.get("smtp_server", "smtp.gmail.com"),
        smtp_port=email_cfg.get("smtp_port", 587),
        sender_email=email_cfg.get("sender_email", ""),
        sender_password=email_cfg.get("sender_password", ""),
        recipient_email=email_cfg.get("recipient_email", ""),
    )

    all_urls = {}
    for search in searches:
        name = search.get("name", "Sin nombre")
        fp = search.get("flight_params")
        hp = search.get("hotel_params")

        if fp:
            flight_urls = URLGenerator.generate_all_flight_urls(fp)
            all_urls.update({f"✈️ {name} - {k}": v for k, v in flight_urls.items()})
            for airline in airlines:
                url = URLGenerator.airline_direct(
                    airline, fp["origin"], fp["destination"],
                    fp["date_depart"], fp["date_return"],
                    fp.get("adults", 1), fp.get("children", 0),
                    fp.get("infants_lap", 0),
                )
                if url:
                    all_urls[f"✈️ {name} - {airline} (directo)"] = url

        if hp:
            hotel_urls = URLGenerator.generate_all_hotel_urls(hp)
            all_urls.update({f"🏨 {name} - {k}": v for k, v in hotel_urls.items()})

    # Enviar email con URLs
    notifier.notify_search_summary([], [], all_urls, {
        "searches": [s.get("name", "?") for s in searches]
    })

    print(f"✅ Email enviado con {len(all_urls)} URLs")
    for name, url in all_urls.items():
        print(f"   {name}: {url[:70]}...")


if __name__ == "__main__":
    main()
