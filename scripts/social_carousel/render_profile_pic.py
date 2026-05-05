#!/usr/bin/env python3
"""TripCazador IG profile picture — RADAR oficial A1.

Usa el SVG primario logo-a1-primary.svg (decisión brand 2026-05-01):
fondo navy gradient + 3 círculos radar ámbar punteados + sweep line +
avión silueta ámbar + wordmark TRIP/CAZADOR.

Genera 1080×1080 (HD IG) + 320×320 (IG min) PNG.
"""
from pathlib import Path
import cairosvg

SVG = Path(
    "/sessions/laughing-modest-bohr/mnt/Viajes/tripcazador-web/public/"
    "logo-a1-primary.svg"
)
OUT = Path("/sessions/laughing-modest-bohr/mnt/Viajes/canva_propuesta_barcelona")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    svg_bytes = SVG.read_bytes()

    cairosvg.svg2png(
        bytestring=svg_bytes,
        write_to=str(OUT / "ig_profile_pic.png"),
        output_width=1080,
        output_height=1080,
    )
    cairosvg.svg2png(
        bytestring=svg_bytes,
        write_to=str(OUT / "ig_profile_pic_320.png"),
        output_width=320,
        output_height=320,
    )
    print("✓ Profile pic radar A1 — 1080 + 320 saved")


if __name__ == "__main__":
    main()
