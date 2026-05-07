#!/usr/bin/env python3
"""
TripCazador — Generador de sticker pack Telegram (SSS84 May 2026)

Genera 8 stickers 512×512 PNG con paleta TripCazador (navy + amber) y los
guarda en branding/stickers/. Cada sticker tiene un emoji + texto + decoración
geométrica simple. Diseñado para subir al @Stickers bot Telegram.

Uso:
  python scripts/generate_telegram_stickers.py
"""
from __future__ import annotations

import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Paleta TripCazador
NAVY = (15, 23, 42)            # #0F172A
AMBER = (251, 191, 36)         # #FBBF24
AMBER_DIM = (218, 165, 32)
WHITE = (255, 255, 255)
WHITE_DIM = (255, 255, 255, 200)

OUT_DIR = Path(__file__).resolve().parent.parent / "branding" / "stickers"
OUT_DIR.mkdir(parents=True, exist_ok=True)
W = H = 512  # Telegram standard

# Try to load DejaVu fonts (always available on Linux)
def find_font(bold: bool = True) -> str:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
    ]
    for f in candidates:
        if Path(f).exists():
            return f
    return ""


F_BOLD = find_font(bold=True)
F_REG = find_font(bold=False)


def text_w(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> int:
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0]


def transparent_canvas() -> Image.Image:
    """Telegram requires transparent background for stickers."""
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


def draw_navy_pill(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int,
                   bg=NAVY, border=AMBER, border_w=10) -> None:
    radius = h // 2
    # Outer amber border
    draw.rounded_rectangle(
        [(x - border_w, y - border_w), (x + w + border_w, y + h + border_w)],
        radius=radius + border_w, fill=border + (255,) if len(border) == 3 else border,
    )
    # Inner navy
    draw.rounded_rectangle(
        [(x, y), (x + w, y + h)],
        radius=radius, fill=bg + (255,) if len(bg) == 3 else bg,
    )


def emoji_text(canvas: Image.Image, emoji: str, text: str, color=AMBER,
               text_size=88, emoji_size=180, gap=20) -> Image.Image:
    """Layout: emoji centered top + text below, both within canvas."""
    draw = ImageDraw.Draw(canvas)
    fnt_emoji = ImageFont.truetype(F_BOLD, emoji_size) if F_BOLD else ImageFont.load_default()
    fnt_text = ImageFont.truetype(F_BOLD, text_size) if F_BOLD else ImageFont.load_default()

    # Center vertically the whole stack
    ew = text_w(draw, emoji, fnt_emoji)
    tw = text_w(draw, text, fnt_text)
    e_bbox = draw.textbbox((0, 0), emoji, font=fnt_emoji)
    eh = e_bbox[3] - e_bbox[1]
    th = text_size
    total_h = eh + gap + th
    y_start = (H - total_h) // 2

    draw.text(((W - ew) // 2, y_start), emoji, font=fnt_emoji, fill=color + (255,))
    draw.text(((W - tw) // 2, y_start + eh + gap), text, font=fnt_text, fill=color + (255,),
              stroke_width=4, stroke_fill=NAVY + (255,))
    return canvas


def sticker_1_chollo() -> Image.Image:
    img = transparent_canvas()
    draw = ImageDraw.Draw(img)
    # Background circle navy con ribete amber
    cx, cy, r = W // 2, H // 2, 230
    draw.ellipse([(cx - r - 12, cy - r - 12), (cx + r + 12, cy + r + 12)], fill=AMBER + (255,))
    draw.ellipse([(cx - r, cy - r), (cx + r, cy + r)], fill=NAVY + (255,))
    return emoji_text(img, "🔥", "¡CHOLLO!", color=AMBER, text_size=68)


def sticker_2_error_fare() -> Image.Image:
    img = transparent_canvas()
    draw = ImageDraw.Draw(img)
    # Sharp diamond background
    pts = [(W // 2, 30), (W - 30, H // 2), (W // 2, H - 30), (30, H // 2)]
    draw.polygon(pts, fill=AMBER + (255,))
    pts2 = [(W // 2, 60), (W - 60, H // 2), (W // 2, H - 60), (60, H // 2)]
    draw.polygon(pts2, fill=NAVY + (255,))
    return emoji_text(img, "⚡", "ERROR FARE", color=AMBER, text_size=52)


def sticker_3_a_cazar() -> Image.Image:
    img = transparent_canvas()
    draw = ImageDraw.Draw(img)
    # Soft rounded rect background
    draw.rounded_rectangle([(20, 20), (W - 20, H - 20)], radius=80, fill=AMBER + (255,))
    draw.rounded_rectangle([(45, 45), (W - 45, H - 45)], radius=70, fill=NAVY + (255,))
    return emoji_text(img, "✈️", "¡A CAZAR!", color=AMBER, text_size=64)


def sticker_4_diana() -> Image.Image:
    img = transparent_canvas()
    draw = ImageDraw.Draw(img)
    # Concentric circles
    cx, cy = W // 2, H // 2
    for i, (r, c) in enumerate([(220, AMBER), (180, WHITE), (140, AMBER), (100, WHITE), (60, AMBER)]):
        draw.ellipse([(cx - r, cy - r), (cx + r, cy + r)], fill=c + (255,))
    fnt = ImageFont.truetype(F_BOLD, 100) if F_BOLD else ImageFont.load_default()
    draw.text((cx - 30, cy - 60), "🎯", font=fnt, fill=NAVY + (255,))
    return img


def sticker_5_ahorro() -> Image.Image:
    img = transparent_canvas()
    draw = ImageDraw.Draw(img)
    # Money rays
    cx, cy = W // 2, H // 2
    for angle in range(0, 360, 30):
        rad = math.radians(angle)
        x1 = cx + math.cos(rad) * 80
        y1 = cy + math.sin(rad) * 80
        x2 = cx + math.cos(rad) * 240
        y2 = cy + math.sin(rad) * 240
        draw.line([(x1, y1), (x2, y2)], fill=AMBER + (180,), width=12)
    draw.ellipse([(cx - 110, cy - 110), (cx + 110, cy + 110)], fill=NAVY + (255,))
    fnt = ImageFont.truetype(F_BOLD, 36) if F_BOLD else ImageFont.load_default()
    text = "AHORRO\nTOTAL"
    for i, line in enumerate(text.split("\n")):
        tw = text_w(draw, line, fnt)
        draw.text(((W - tw) // 2, cy - 38 + i * 38), line, font=fnt, fill=AMBER + (255,))
    return img


def sticker_6_de_viaje() -> Image.Image:
    img = transparent_canvas()
    draw = ImageDraw.Draw(img)
    # Wave pattern
    for y in range(60, H - 60, 30):
        draw.arc([(40, y), (W - 40, y + 60)], start=0, end=180, fill=AMBER + (200,), width=4)
    draw.rectangle([(60, H // 2 - 90), (W - 60, H // 2 + 90)], fill=NAVY + (255,), outline=AMBER, width=8)
    return emoji_text(img, "🏖️", "¡DE VIAJE!", color=AMBER, text_size=56, emoji_size=140)


def sticker_7_finde() -> Image.Image:
    img = transparent_canvas()
    draw = ImageDraw.Draw(img)
    # Notebook pages
    draw.rectangle([(40, 40), (W - 40, H - 40)], fill=NAVY + (255,), outline=AMBER, width=8)
    for y in range(80, H - 80, 35):
        draw.line([(80, y), (W - 80, y)], fill=AMBER + (60,), width=2)
    return emoji_text(img, "🌴", "ME VOY EL\nFINDE", color=AMBER, text_size=46, emoji_size=120)


def sticker_8_gracias() -> Image.Image:
    img = transparent_canvas()
    draw = ImageDraw.Draw(img)
    # Heart shape
    cx = W // 2
    cy = H // 2 + 30
    # Two circles + triangle = heart
    draw.ellipse([(cx - 180, cy - 180), (cx, cy)], fill=AMBER + (255,))
    draw.ellipse([(cx, cy - 180), (cx + 180, cy)], fill=AMBER + (255,))
    draw.polygon([(cx - 175, cy - 30), (cx + 175, cy - 30), (cx, cy + 200)], fill=AMBER + (255,))
    fnt = ImageFont.truetype(F_BOLD, 48) if F_BOLD else ImageFont.load_default()
    text = "GRACIAS\nTC"
    for i, line in enumerate(text.split("\n")):
        tw = text_w(draw, line, fnt)
        draw.text(((W - tw) // 2, cy - 30 + i * 50), line, font=fnt, fill=NAVY + (255,))
    return img


STICKERS = [
    ("01_chollo.png", sticker_1_chollo),
    ("02_error_fare.png", sticker_2_error_fare),
    ("03_a_cazar.png", sticker_3_a_cazar),
    ("04_diana.png", sticker_4_diana),
    ("05_ahorro_total.png", sticker_5_ahorro),
    ("06_de_viaje.png", sticker_6_de_viaje),
    ("07_finde.png", sticker_7_finde),
    ("08_gracias.png", sticker_8_gracias),
]


def main() -> int:
    print(f"Generating {len(STICKERS)} stickers → {OUT_DIR}")
    for filename, fn in STICKERS:
        img = fn()
        out_path = OUT_DIR / filename
        img.save(out_path, "PNG", optimize=True)
        size_kb = out_path.stat().st_size // 1024
        print(f"  ✓ {filename} ({size_kb}KB)")
    print(f"\nDone. Upload to @Stickers bot:")
    print(f"  1. /newpack")
    print(f"  2. Name: TripCazador Cazadores")
    print(f"  3. Send each PNG + 1-2 emoji per sticker")
    print(f"  4. /publish")
    print(f"  5. Short name: tripcazador")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
