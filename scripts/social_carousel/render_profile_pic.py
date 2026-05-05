#!/usr/bin/env python3
"""SSS65 — TripCazador IG profile picture 1080×1080.

Diseño: cuadrado navy con birdwing/cazador-arrow ámbar grande centrado,
"Trip" + "Cazador" debajo en sans bold, tagline mini.
Visible incluso en miniatura 110×110 (logo dominante en el cuadro).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path("/sessions/laughing-modest-bohr/mnt/Viajes/canva_propuesta_barcelona")
NAVY = (10, 21, 48)
AMBER = (251, 191, 36)
WHITE = (255, 255, 255)

F_SANS_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
F_SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

W = H = 1080


def draw_bird(draw, cx, cy, size=440, color=AMBER):
    """Geometric bird/arrow icon — same as DealCard SVG.
    Centered at (cx, cy), bounding box ~size×size."""
    s = size / 100.0
    # Original SVG path translated to absolute coords with offset
    pts_local = [
        (10, 42), (26, 30), (40, 38), (50, 22), (60, 38), (74, 30),
        (90, 42), (74, 48), (80, 62), (62, 56), (50, 78), (56, 90),
        (50, 94), (44, 90), (38, 56), (20, 62), (26, 48),
    ]
    pts = [(cx + (x - 50) * s, cy + (y - 58) * s) for x, y in pts_local]
    draw.polygon(pts, fill=color)


def main():
    img = Image.new("RGB", (W, H), NAVY)
    draw = ImageDraw.Draw(img)

    # Subtle radial gradient — navy más claro hacia el centro
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    cx, cy = W // 2, H // 2
    max_r = (W // 2) * 1.2
    for r in range(int(max_r), 0, -8):
        # progressively lighter towards center
        t = r / max_r
        # navy gets slightly lighter near center
        delta = int(20 * (1 - t))
        col = (NAVY[0] + delta, NAVY[1] + delta, NAVY[2] + delta + delta // 2, 255)
        odraw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=col)
    img = overlay.convert("RGB")
    draw = ImageDraw.Draw(img)

    # Big amber bird centered, slightly above middle
    draw_bird(draw, W // 2, int(H * 0.42), size=540)

    # "TripCazador" wordmark below
    fnt_brand = ImageFont.truetype(F_SANS_BOLD, 110)
    text_a = "Trip"
    text_b = "Cazador"
    aw = draw.textbbox((0, 0), text_a, font=fnt_brand)[2]
    bw = draw.textbbox((0, 0), text_b, font=fnt_brand)[2]
    total_w = aw + bw
    text_x = (W - total_w) // 2
    text_y = int(H * 0.69)
    draw.text((text_x, text_y), text_a, font=fnt_brand, fill=AMBER)
    draw.text((text_x + aw, text_y), text_b, font=fnt_brand, fill=WHITE)

    # Tagline below
    fnt_tagline = ImageFont.truetype(F_SANS_BOLD, 30)
    tagline = "EL CAZADOR DE CHOLLOS"
    tw = draw.textbbox((0, 0), tagline, font=fnt_tagline)[2]
    draw.text(((W - tw) // 2, int(H * 0.84)), tagline, font=fnt_tagline,
              fill=(220, 220, 220))
    # Letter-spacing visual: amber underline
    underline_w = tw + 40
    underline_x = (W - underline_w) // 2
    draw.rectangle(
        [(underline_x, int(H * 0.84) + 50), (underline_x + underline_w, int(H * 0.84) + 54)],
        fill=AMBER,
    )

    # Save both 1080 (HD) and 320 (IG min)
    img.save(OUT / "ig_profile_pic.png", "PNG", quality=95)
    img.resize((320, 320), Image.LANCZOS).save(OUT / "ig_profile_pic_320.png", "PNG", quality=95)
    print("✓ Profile pic 1080 + 320 saved")


if __name__ == "__main__":
    main()
