"""
TripCazador — brand asset generator.
Generates logos (3 concepts), OG image, favicons, and social templates.
Uses PIL + matplotlib. Fonts: JetBrainsMono + WorkSans (Inter-like) + InstrumentSans.
"""
import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FONTS = "/sessions/laughing-modest-bohr/mnt/.claude/skills/canvas-design/canvas-fonts"
JB_REG = os.path.join(FONTS, "JetBrainsMono-Regular.ttf")
JB_BOLD = os.path.join(FONTS, "JetBrainsMono-Bold.ttf")
WS_REG = os.path.join(FONTS, "WorkSans-Regular.ttf")
WS_BOLD = os.path.join(FONTS, "WorkSans-Bold.ttf")
IS_REG = os.path.join(FONTS, "InstrumentSans-Regular.ttf")
IS_BOLD = os.path.join(FONTS, "InstrumentSans-Bold.ttf")
GEIST_REG = os.path.join(FONTS, "GeistMono-Regular.ttf")

OUT = "/sessions/laughing-modest-bohr/mnt/Viajes/branding"
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.join(OUT, "favicon"), exist_ok=True)
os.makedirs(os.path.join(OUT, "social"), exist_ok=True)

# Palette
BG_DARK = (3, 7, 18, 255)       # #030712
BG_CARD = (15, 23, 42, 255)     # #0f172a
AMBER = (245, 158, 11, 255)     # #f59e0b
AMBER_HI = (251, 191, 36, 255)  # #fbbf24
TEXT = (229, 231, 235, 255)     # #e5e7eb
MUTED = (156, 163, 175, 255)    # #9ca3af
TRANSPARENT = (0, 0, 0, 0)


def load(font_path, size):
    return ImageFont.truetype(font_path, size)


def tight_text_wh(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1], bbox[0], bbox[1]


# ------------------------------------------------------------
# CONCEPT 1 — TECH: terminal de datos, radar circular, mono
# ------------------------------------------------------------
def render_iso_tech(size=512, bg=None):
    img = Image.new("RGBA", (size, size), bg if bg else TRANSPARENT)
    d = ImageDraw.Draw(img)
    cx, cy = size / 2, size / 2
    # Outer square bracket frame (terminal feel)
    bracket_t = max(2, int(size * 0.012))
    pad = int(size * 0.12)
    corner = int(size * 0.10)
    # corners
    for (x1, y1, x2, y2) in [
        (pad, pad, pad + corner, pad + bracket_t),
        (pad, pad, pad + bracket_t, pad + corner),
        (size - pad - corner, pad, size - pad, pad + bracket_t),
        (size - pad - bracket_t, pad, size - pad, pad + corner),
        (pad, size - pad - bracket_t, pad + corner, size - pad),
        (pad, size - pad - corner, pad + bracket_t, size - pad),
        (size - pad - corner, size - pad - bracket_t, size - pad, size - pad),
        (size - pad - bracket_t, size - pad - corner, size - pad, size - pad),
    ]:
        d.rectangle([min(x1, x2), min(y1, y2), max(x1, x2), max(y1, y2)], fill=AMBER)

    # Concentric radar rings
    for i, r in enumerate([0.34, 0.26, 0.18, 0.10]):
        rr = int(size * r)
        col = (*AMBER[:3], 70 if i else 180)
        width = max(1, int(size * (0.006 if i == 0 else 0.004)))
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=col, width=width)

    # Cross hairs (thin)
    hair = max(1, int(size * 0.003))
    d.line([(cx, cy - size * 0.36), (cx, cy - size * 0.38)], fill=AMBER, width=hair)
    d.line([(cx, cy + size * 0.36), (cx, cy + size * 0.38)], fill=AMBER, width=hair)
    d.line([(cx - size * 0.36, cy), (cx - size * 0.38, cy)], fill=AMBER, width=hair)
    d.line([(cx + size * 0.36, cy), (cx + size * 0.38, cy)], fill=AMBER, width=hair)

    # Sweep line (radar beam)
    sweep_len = int(size * 0.30)
    angle = math.radians(-35)
    x2 = cx + math.cos(angle) * sweep_len
    y2 = cy + math.sin(angle) * sweep_len
    d.line([(cx, cy), (x2, y2)], fill=AMBER_HI, width=max(2, int(size * 0.008)))

    # Detected blip (amber dot)
    blip_r = int(size * 0.035)
    bx, by = cx + math.cos(angle) * sweep_len * 0.92, cy + math.sin(angle) * sweep_len * 0.92
    # glow
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([bx - blip_r * 3, by - blip_r * 3, bx + blip_r * 3, by + blip_r * 3],
               fill=(*AMBER_HI[:3], 90))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=size * 0.012))
    img.alpha_composite(glow)
    d = ImageDraw.Draw(img)
    d.ellipse([bx - blip_r, by - blip_r, bx + blip_r, by + blip_r], fill=AMBER_HI)

    # CV in mono centered at bottom portion
    font = load(JB_BOLD, int(size * 0.12))
    txt = "CV"
    w, h, ox, oy = tight_text_wh(d, txt, font)
    tx = cx - (w / 2) - ox
    ty = cy + size * 0.28 - (h / 2) - oy
    # Draw on a mask so it sits nicely
    d.text((tx, ty), txt, font=font, fill=TEXT)

    return img


def render_horiz_tech(w=1024, h=1024, bg=None):
    # Wide horizontal 1024x1024 with lock-up
    img = Image.new("RGBA", (w, h), bg if bg else TRANSPARENT)
    d = ImageDraw.Draw(img)

    # Compose: iso left (square ~ 0.55*h), wordmark right
    iso_size = int(h * 0.55)
    iso = render_iso_tech(size=iso_size, bg=None)
    margin_x = int(w * 0.06)
    iso_x = margin_x
    iso_y = (h - iso_size) // 2
    img.alpha_composite(iso, (iso_x, iso_y))

    # Wordmark (mono, all caps) — sized so it fits the canvas width
    f_main = load(JB_BOLD, int(h * 0.115))
    txt = "TRIPCAZADOR"
    tw, th, ox, oy = tight_text_wh(d, txt, f_main)
    tx = iso_x + iso_size + int(w * 0.03)
    ty = (h / 2) - (th / 2) - oy - int(h * 0.02)
    d.text((tx, ty), txt, font=f_main, fill=TEXT)

    # Subline: tagline mono small + amber dot
    f_sub = load(JB_REG, int(h * 0.038))
    sub = "[ deal_radar // es ]"
    sw, sh, sox, soy = tight_text_wh(d, sub, f_sub)
    sy = ty + th + int(h * 0.035)
    d.text((tx, sy), sub, font=f_sub, fill=MUTED)
    # amber cursor dot at end of word
    dot_r = int(h * 0.018)
    dot_x = tx + tw + int(h * 0.02)
    dot_y = ty + th - dot_r - int(h * 0.01)
    d.ellipse([dot_x, dot_y, dot_x + 2 * dot_r, dot_y + 2 * dot_r], fill=AMBER)

    return img


# ------------------------------------------------------------
# CONCEPT 2 — AVENTURA: ave rapaz estilizada, orgánica, dorada
# ------------------------------------------------------------
def render_falcon(size, color=AMBER, thin=False):
    """Stylized raptor — wings up in a bold V, compact body, small head.

    Reference feeling: high-end sports brand raptor mark (think a logo-grade
    heraldic bird). Single continuous silhouette: no tiny insect-like accents.
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = size

    # Main silhouette — one continuous polygon from left wingtip, over the
    # head, to right wingtip, then down under each wing and back through the
    # tail. Coordinates tuned for a strong raptor gesture.
    silhouette = [
        # left wingtip
        (0.04, 0.32),
        # upper edge of left wing sweeping up to head
        (0.18, 0.24),
        (0.32, 0.24),
        (0.42, 0.28),
        # head top
        (0.48, 0.22),
        (0.50, 0.18),
        (0.52, 0.22),
        # head top right
        (0.58, 0.28),
        (0.68, 0.24),
        (0.82, 0.24),
        # right wingtip
        (0.96, 0.32),
        # right wing lower edge curving back to body
        (0.82, 0.42),
        (0.66, 0.48),
        (0.58, 0.50),
        # right body/tail edge
        (0.56, 0.58),
        (0.54, 0.70),  # tail tip right
        (0.50, 0.78),  # tail point
        (0.46, 0.70),  # tail tip left
        (0.44, 0.58),
        # left body edge back to wing
        (0.42, 0.50),
        (0.34, 0.48),
        (0.18, 0.42),
    ]
    d.polygon([(int(x * s), int(y * s)) for x, y in silhouette], fill=color)

    return img


def render_iso_aventura(size=512, bg=None):
    img = Image.new("RGBA", (size, size), bg if bg else TRANSPARENT)
    d = ImageDraw.Draw(img)
    # Circular plate (subtle) only when on dark bg — skip for clean transparent
    # Falcon, large and tilted diving motion
    falcon = render_falcon(size=int(size * 0.86), color=AMBER)
    # center
    fx = (size - falcon.size[0]) // 2
    fy = (size - falcon.size[1]) // 2
    img.alpha_composite(falcon, (fx, fy))

    # Tiny CV monogram at bottom in serif? No — the isotype is purely the falcon
    return img


def render_horiz_aventura(w=1024, h=1024, bg=None):
    img = Image.new("RGBA", (w, h), bg if bg else TRANSPARENT)
    d = ImageDraw.Draw(img)

    iso_size = int(h * 0.52)
    iso = render_iso_aventura(size=iso_size, bg=None)
    margin_x = int(w * 0.05)
    iso_x = margin_x
    iso_y = (h - iso_size) // 2
    img.alpha_composite(iso, (iso_x, iso_y))

    # Wordmark: InstrumentSans Bold with personality, two-color
    f_main = load(IS_BOLD, int(h * 0.125))
    part1 = "Trip"
    part2 = "Cazador"
    w1, h1, ox1, oy1 = tight_text_wh(d, part1, f_main)
    w2, h2, ox2, oy2 = tight_text_wh(d, part2, f_main)
    tx = iso_x + iso_size + int(w * 0.03)
    ty = (h / 2) - (max(h1, h2) / 2) - oy1 - int(h * 0.015)
    d.text((tx, ty), part1, font=f_main, fill=AMBER)
    d.text((tx + w1 + int(w * 0.005), ty), part2, font=f_main, fill=TEXT)

    # Tagline
    f_sub = load(WS_REG, int(h * 0.038))
    sub = "el cazador de chollos · europa"
    sw, sh, sox, soy = tight_text_wh(d, sub, f_sub)
    sy = ty + max(h1, h2) + int(h * 0.03)
    d.text((tx, sy), sub, font=f_sub, fill=MUTED)

    return img


# ------------------------------------------------------------
# CONCEPT 3 — HIBRIDO: ave geométrica + diana concéntrica
# ------------------------------------------------------------
def render_geometric_bird(size, color=AMBER):
    """Angular paper-plane/falcon hybrid formed from triangles."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = size
    # Main body triangle (arrowhead pointing up-right)
    body = [
        (0.50, 0.18),  # nose
        (0.82, 0.62),  # bottom right
        (0.52, 0.58),  # belly
    ]
    d.polygon([(int(x * s), int(y * s)) for x, y in body], fill=color)

    # Left wing triangle
    wing_l = [
        (0.50, 0.18),
        (0.18, 0.62),
        (0.52, 0.58),
    ]
    d.polygon([(int(x * s), int(y * s)) for x, y in wing_l], fill=color)

    # Tail / afterwing (darker separation by cutting gap)
    # Lower swept accent
    accent = [
        (0.52, 0.58),
        (0.78, 0.72),
        (0.58, 0.74),
    ]
    d.polygon([(int(x * s), int(y * s)) for x, y in accent], fill=color)
    accent_l = [
        (0.52, 0.58),
        (0.26, 0.72),
        (0.46, 0.74),
    ]
    d.polygon([(int(x * s), int(y * s)) for x, y in accent_l], fill=color)

    return img


def render_iso_hibrido(size=512, bg=None):
    img = Image.new("RGBA", (size, size), bg if bg else TRANSPARENT)
    d = ImageDraw.Draw(img)
    cx, cy = size / 2, size / 2

    # Target rings (concentric), amber
    for i, r_frac in enumerate([0.46, 0.36, 0.26]):
        rr = int(size * r_frac)
        width = max(2, int(size * 0.012))
        alpha = 255 if i == 0 else 140 if i == 1 else 80
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr],
                  outline=(*AMBER[:3], alpha), width=width)

    # Bird inside target, centered
    bird_size = int(size * 0.52)
    bird = render_geometric_bird(size=bird_size, color=AMBER_HI)
    bx = int(cx - bird_size / 2)
    by = int(cy - bird_size / 2) + int(size * 0.01)
    img.alpha_composite(bird, (bx, by))

    return img


def render_horiz_hibrido(w=1024, h=1024, bg=None):
    img = Image.new("RGBA", (w, h), bg if bg else TRANSPARENT)
    d = ImageDraw.Draw(img)

    iso_size = int(h * 0.55)
    iso = render_iso_hibrido(size=iso_size, bg=None)
    margin_x = int(w * 0.05)
    iso_x = margin_x
    iso_y = (h - iso_size) // 2
    img.alpha_composite(iso, (iso_x, iso_y))

    # Wordmark: WorkSans bold (Inter-alike)
    f_main = load(WS_BOLD, int(h * 0.12))
    txt = "TripCazador"
    tw, th, ox, oy = tight_text_wh(d, txt, f_main)
    tx = iso_x + iso_size + int(w * 0.03)
    ty = (h / 2) - (th / 2) - oy - int(h * 0.025)
    d.text((tx, ty), txt, font=f_main, fill=TEXT)

    # Sub: mono tagline with IATA-ish code accent
    f_sub = load(JB_REG, int(h * 0.036))
    sub = "precision · deals · 24/7"
    d.text((tx, ty + th + int(h * 0.03)), sub, font=f_sub, fill=AMBER)

    return img


# ------------------------------------------------------------
# Driver to render all logos (transparent + on dark)
# ------------------------------------------------------------
def add_dark_bg(img, bg=BG_DARK):
    base = Image.new("RGBA", img.size, bg)
    base.alpha_composite(img)
    return base


def export_logos():
    variants = {
        "tech": (render_iso_tech, render_horiz_tech),
        "aventura": (render_iso_aventura, render_horiz_aventura),
        "hibrido": (render_iso_hibrido, render_horiz_hibrido),
    }
    for name, (iso_fn, horiz_fn) in variants.items():
        # Isotype 512 (transparent + dark)
        iso = iso_fn(512)
        iso.save(os.path.join(OUT, f"trip_cazador_iso_{name}.png"))
        add_dark_bg(iso).save(os.path.join(OUT, f"trip_cazador_iso_{name}_dark.png"))
        # Also 1024 transparent for high-res
        iso_hi = iso_fn(1024)
        iso_hi.save(os.path.join(OUT, f"trip_cazador_iso_{name}_1024.png"))

        # Horizontal 1024x1024 (wordmark lockup). For horizontal format we
        # use a wide canvas 1600x1024 since "horizontal" needs width > height.
        hz = horiz_fn(1600, 1024)
        hz.save(os.path.join(OUT, f"trip_cazador_horizontal_{name}.png"))
        add_dark_bg(hz).save(os.path.join(OUT, f"trip_cazador_horizontal_{name}_dark.png"))

    print("Logos exported.")


# ------------------------------------------------------------
# OG image 1200x630
# ------------------------------------------------------------
def draw_route_lines(draw, w, h, color=(245, 158, 11, 40), n=7):
    import random
    random.seed(7)
    for _ in range(n):
        x1 = random.randint(-100, w + 100)
        y1 = random.randint(-50, h + 50)
        x2 = random.randint(-100, w + 100)
        y2 = random.randint(-50, h + 50)
        # mid-point curve via two-step polyline
        mx = (x1 + x2) // 2 + random.randint(-80, 80)
        my = (y1 + y2) // 2 + random.randint(-40, 40)
        draw.line([(x1, y1), (mx, my), (x2, y2)], fill=color, width=1)
        # endpoint dots
        draw.ellipse([x1 - 3, y1 - 3, x1 + 3, y1 + 3], fill=(*AMBER[:3], 140))
        draw.ellipse([x2 - 3, y2 - 3, x2 + 3, y2 + 3], fill=(*AMBER[:3], 140))


def export_og():
    w, h = 1200, 630
    img = Image.new("RGBA", (w, h), BG_DARK)
    # Subtle gradient via overlay
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for y in range(h):
        a = int(25 * (1 - y / h))
        gd.line([(0, y), (w, y)], fill=(245, 158, 11, a))
    img = Image.alpha_composite(img, grad)

    d = ImageDraw.Draw(img)
    # Route pattern background
    draw_route_lines(d, w, h, color=(245, 158, 11, 30), n=10)

    # Logo hibrido horizontal, scaled
    logo = render_horiz_hibrido(1400, 400)
    # scale to fit
    target_w = 720
    ratio = target_w / logo.size[0]
    logo = logo.resize((target_w, int(logo.size[1] * ratio)), Image.LANCZOS)
    img.alpha_composite(logo, (70, 80))

    # Tagline
    f_tag = load(WS_BOLD, 48)
    tag = "El cazador automático de chollos"
    f_sub = load(WS_REG, 34)
    sub = "de vuelo desde Europa"
    d.text((90, 330), tag, font=f_tag, fill=AMBER)
    d.text((90, 390), sub, font=f_sub, fill=TEXT)

    # Bottom mono line
    f_bottom = load(JB_REG, 22)
    d.text((90, h - 70), "tripcazador.com  //  error fares · business @ economy · 24/7", font=f_bottom, fill=MUTED)

    # Small amber accent bar at bottom-left
    d.rectangle([(70, h - 90), (80, h - 50)], fill=AMBER)

    img.convert("RGB").save(os.path.join(OUT, "og_default.png"), "PNG")
    print("OG exported.")


# ------------------------------------------------------------
# Favicon set from HIBRIDO isotype
# ------------------------------------------------------------
def export_favicons():
    fav_dir = os.path.join(OUT, "favicon")
    os.makedirs(fav_dir, exist_ok=True)

    # Source 1024 transparent
    src = render_iso_hibrido(1024)

    # Sizes
    sizes = {
        "favicon-16x16.png": 16,
        "favicon-32x32.png": 32,
        "apple-touch-icon.png": 180,
        "android-chrome-192x192.png": 192,
        "android-chrome-512x512.png": 512,
    }
    for fname, s in sizes.items():
        resized = src.resize((s, s), Image.LANCZOS)
        if "apple" in fname or "android" in fname:
            # Apple/Android: use dark bg plate
            plate = Image.new("RGBA", (s, s), BG_DARK)
            plate.alpha_composite(resized)
            plate.save(os.path.join(fav_dir, fname))
        else:
            resized.save(os.path.join(fav_dir, fname))

    # Multi-size .ico
    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    ims = [src.resize(sz, Image.LANCZOS) for sz in ico_sizes]
    ims[0].save(os.path.join(fav_dir, "favicon.ico"),
                format="ICO",
                sizes=ico_sizes,
                append_images=ims[1:])

    # site.webmanifest
    manifest = """{
  "name": "TripCazador",
  "short_name": "TripCazador",
  "description": "El cazador automático de chollos de vuelo desde Europa.",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#f59e0b",
  "background_color": "#030712",
  "display": "standalone",
  "start_url": "/"
}
"""
    with open(os.path.join(fav_dir, "site.webmanifest"), "w") as f:
        f.write(manifest)
    print("Favicons exported.")


# ------------------------------------------------------------
# Social templates
# ------------------------------------------------------------
def template_header(img, d, w, h, small=False):
    # Route pattern
    draw_route_lines(d, w, h, color=(245, 158, 11, 22), n=8)
    # Logo top-left
    lg_target = int(w * 0.32) if not small else int(w * 0.45)
    logo = render_horiz_hibrido(1600, 400)
    ratio = lg_target / logo.size[0]
    logo = logo.resize((lg_target, int(logo.size[1] * ratio)), Image.LANCZOS)
    img.alpha_composite(logo, (int(w * 0.05), int(h * 0.04)))


def draw_price_card(d, w, h, box, font_price, font_label, font_mono,
                    placeholder_price="€ 189", placeholder_label="PRECIO TOTAL"):
    x1, y1, x2, y2 = box
    # card
    d.rounded_rectangle(box, radius=18, fill=BG_CARD, outline=(*AMBER[:3], 120), width=2)
    # accent bar
    d.rectangle([x1, y1, x1 + 8, y2], fill=AMBER)
    # label
    d.text((x1 + 30, y1 + 22), placeholder_label, font=font_label, fill=MUTED)
    # price
    d.text((x1 + 30, y1 + 50), placeholder_price, font=font_price, fill=AMBER)


def export_telegram():
    w, h = 1280, 720
    img = Image.new("RGBA", (w, h), BG_DARK)
    # ambient gradient
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for y in range(h):
        a = int(30 * (1 - y / h))
        gd.line([(0, y), (w, y)], fill=(245, 158, 11, a))
    img = Image.alpha_composite(img, grad)
    d = ImageDraw.Draw(img)

    template_header(img, d, w, h)
    d = ImageDraw.Draw(img)

    # Route block (big) — ORIGIN → DEST with IATA mono
    # Layout split: left half = route, right half = price card
    f_iata = load(JB_BOLD, 110)
    f_city = load(WS_REG, 28)

    origin_iata = "BSL"
    dest_iata = "JFK"
    origin_city = "Basel"
    dest_city = "Nueva York"

    # Route stacked: BSL top, arrow, JFK below
    d.text((80, 230), origin_iata, font=f_iata, fill=TEXT)
    d.text((80, 350), origin_city, font=f_city, fill=MUTED)
    # arrow
    ax, ay = 320, 290
    d.line([(ax, ay + 30), (ax + 110, ay + 30)], fill=AMBER, width=5)
    d.polygon([(ax + 110, ay + 15),
               (ax + 140, ay + 30),
               (ax + 110, ay + 45)], fill=AMBER)
    d.text((480, 230), dest_iata, font=f_iata, fill=AMBER)
    d.text((480, 350), dest_city, font=f_city, fill=MUTED)

    # Price card right side (wider and taller)
    draw_price_card(
        d, w, h,
        box=(w - 420, 230, w - 80, 400),
        font_price=load(WS_BOLD, 64),
        font_label=load(JB_REG, 18),
        font_mono=load(JB_REG, 20),
    )

    # Meta row at bottom
    f_meta = load(JB_REG, 24)
    d.text((80, h - 120), "[AEROLINEA] · [FECHA_IDA] — [FECHA_VUELTA] · [CLASE]", font=f_meta, fill=MUTED)
    d.text((80, h - 80), "tripcazador.com/deal/[slug]", font=f_meta, fill=AMBER)

    img.convert("RGB").save(os.path.join(OUT, "social", "telegram_post_template.png"), "PNG")
    print("Telegram template exported.")


def export_instagram_post():
    w, h = 1080, 1350
    img = Image.new("RGBA", (w, h), BG_DARK)
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for y in range(h):
        a = int(40 * (1 - y / h))
        gd.line([(0, y), (w, y)], fill=(245, 158, 11, a))
    img = Image.alpha_composite(img, grad)
    d = ImageDraw.Draw(img)

    template_header(img, d, w, h, small=True)
    d = ImageDraw.Draw(img)

    # Big CHOLLO ribbon (amber)
    f_ribbon = load(IS_BOLD, 42)
    ribbon_txt = "CHOLLO DETECTADO"
    rw, rh, rox, roy = tight_text_wh(d, ribbon_txt, f_ribbon)
    rx, ry = 80, 290
    d.rectangle([rx - 20, ry - 10, rx + rw + 20, ry + rh + 20], fill=AMBER)
    d.text((rx, ry - roy), ribbon_txt, font=f_ribbon, fill=BG_DARK)

    # Big route
    f_iata = load(JB_BOLD, 190)
    d.text((80, 400), "BSL", font=f_iata, fill=TEXT)
    # arrow below
    d.line([(80, 620), (w - 80, 620)], fill=AMBER, width=4)
    d.polygon([(w - 80, 600), (w - 40, 620), (w - 80, 640)], fill=AMBER)
    d.text((80, 680), "JFK", font=f_iata, fill=AMBER)

    # Price large
    f_price_label = load(JB_REG, 28)
    f_price = load(WS_BOLD, 150)
    d.text((80, 940), "PRECIO TOTAL", font=f_price_label, fill=MUTED)
    d.text((80, 980), "€ 189", font=f_price, fill=AMBER)

    # Normal price strike
    f_normal = load(WS_REG, 40)
    ntxt = "normal €720"
    nw, nh, nox, noy = tight_text_wh(d, ntxt, f_normal)
    nx = 80 + 420
    ny = 1020
    d.text((nx, ny), ntxt, font=f_normal, fill=MUTED)
    d.line([(nx - 4, ny + nh / 2 + 8), (nx + nw + 4, ny + nh / 2 + 8)], fill=MUTED, width=3)

    # Bottom meta
    f_meta = load(JB_REG, 26)
    d.text((80, h - 160), "[AEROLINEA]  ·  [FECHAS]  ·  [CLASE]", font=f_meta, fill=MUTED)
    d.text((80, h - 110), "link en bio → tripcazador.com", font=f_meta, fill=AMBER)

    img.convert("RGB").save(os.path.join(OUT, "social", "instagram_post_template.png"), "PNG")
    print("Instagram post template exported.")


def export_instagram_story():
    w, h = 1080, 1920
    img = Image.new("RGBA", (w, h), BG_DARK)
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for y in range(h):
        a = int(55 * (1 - y / h))
        gd.line([(0, y), (w, y)], fill=(245, 158, 11, a))
    img = Image.alpha_composite(img, grad)
    d = ImageDraw.Draw(img)

    # Scatter route lines
    draw_route_lines(d, w, h, color=(245, 158, 11, 25), n=14)

    # Logo centered at top
    logo = render_horiz_hibrido(1800, 450)
    target_w = int(w * 0.8)
    ratio = target_w / logo.size[0]
    logo = logo.resize((target_w, int(logo.size[1] * ratio)), Image.LANCZOS)
    img.alpha_composite(logo, ((w - target_w) // 2, 140))

    d = ImageDraw.Draw(img)

    # Chollo ribbon
    f_ribbon = load(IS_BOLD, 52)
    ribbon_txt = "CHOLLO DETECTADO"
    rw, rh, rox, roy = tight_text_wh(d, ribbon_txt, f_ribbon)
    rx = (w - rw) // 2
    ry = 540
    d.rectangle([rx - 30, ry - 15, rx + rw + 30, ry + rh + 25], fill=AMBER)
    d.text((rx, ry - roy), ribbon_txt, font=f_ribbon, fill=BG_DARK)

    # Route (stacked, large)
    f_iata = load(JB_BOLD, 260)
    for i, (iata, color) in enumerate([("BSL", TEXT), ("JFK", AMBER)]):
        tw, th, ox, oy = tight_text_wh(d, iata, f_iata)
        d.text(((w - tw) // 2 - ox, 720 + i * 340), iata, font=f_iata, fill=color)

    # arrow between (vertical)
    ax = w // 2
    ay_start, ay_end = 1020, 1080
    d.line([(ax, ay_start), (ax, ay_end)], fill=AMBER, width=6)
    d.polygon([(ax - 30, ay_end - 20), (ax, ay_end + 30), (ax + 30, ay_end - 20)], fill=AMBER)

    # Price
    f_price_label = load(JB_REG, 32)
    ptxt = "PRECIO TOTAL"
    pw, ph, pox, poy = tight_text_wh(d, ptxt, f_price_label)
    d.text(((w - pw) // 2 - pox, 1420), ptxt, font=f_price_label, fill=MUTED)

    f_price = load(WS_BOLD, 160)
    pr = "€ 189"
    prw, prh, prox, proy = tight_text_wh(d, pr, f_price)
    d.text(((w - prw) // 2 - prox, 1470), pr, font=f_price, fill=AMBER)

    # Bottom CTA
    f_cta = load(JB_BOLD, 38)
    cta = "DESLIZA PARA RESERVAR"
    cw, ch, cox, coy = tight_text_wh(d, cta, f_cta)
    d.text(((w - cw) // 2 - cox, h - 260), cta, font=f_cta, fill=AMBER)
    f_url = load(JB_REG, 28)
    url = "tripcazador.com"
    uw, uh, uox, uoy = tight_text_wh(d, url, f_url)
    d.text(((w - uw) // 2 - uox, h - 200), url, font=f_url, fill=MUTED)

    img.convert("RGB").save(os.path.join(OUT, "social", "instagram_story_template.png"), "PNG")
    print("Instagram story template exported.")


# ------------------------------------------------------------
# RUN ALL
# ------------------------------------------------------------
if __name__ == "__main__":
    export_logos()
    export_og()
    export_favicons()
    export_telegram()
    export_instagram_post()
    export_instagram_story()
    print("\n=== ALL ASSETS GENERATED ===")
