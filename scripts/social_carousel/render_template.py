#!/usr/bin/env python3
"""
SSS66 — Canva carousel v3 — incluye logo radar A1 oficial.

Cambios vs v2:
- Pre-renderiza logo-a1-primary.svg → 200px PNG en /tmp
- Plate 1: logo radar grande arriba a la izquierda + wordmark en el footer strip
- Plates 2-5: logo radar pequeño en el bottom strip junto al wordmark
- Mantenemos toda la lógica de Taganga + price hero
"""
from io import BytesIO
from pathlib import Path
import random
import requests
import cairosvg
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = Path("/sessions/laughing-modest-bohr/mnt/Viajes/canva_propuesta_barcelona")
OUT.mkdir(parents=True, exist_ok=True)

LOGO_SVG = Path(
    "/sessions/laughing-modest-bohr/mnt/Viajes/tripcazador-web/public/"
    "logo-a1-primary.svg"
)
LOGO_PNG_SMALL = Path("/tmp/tripcazador_logo_120.png")
LOGO_PNG_MED = Path("/tmp/tripcazador_logo_240.png")

# Brand palette
NAVY = (10, 21, 48)
AMBER = (251, 191, 36)
WHITE = (255, 255, 255)
WHITE_DIM = (235, 235, 235)
TERRACOTTA = (200, 60, 50)
PAPER = (250, 248, 243)

F_SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
F_SERIF_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
F_SERIF_ITAL = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf"
F_SERIF_BOLD_ITAL = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-BoldItalic.ttf"
F_SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
F_SANS_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
F_SANS_MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

W = H = 1080

PHOTOS = {
    "sagrada": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Exterior_of_the_Sagrada_Fam%C3%ADlia.jpg/1280px-Exterior_of_the_Sagrada_Fam%C3%ADlia.jpg",
    "guell":   "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Barcelona_Parc_G%C3%BCell_el_drac.jpg/1280px-Barcelona_Parc_G%C3%BCell_el_drac.jpg",
    "batllo":  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Casa_Batll%C3%B3_01.jpg/1280px-Casa_Batll%C3%B3_01.jpg",
    "born":    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Tapas_in_Barcelona_02.jpg/1280px-Tapas_in_Barcelona_02.jpg",
    "barceloneta": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Promenade_and_beach%2C_Platja_de_la_Barceloneta%2C_Barcelona%2C_2015.jpg/1280px-Promenade_and_beach%2C_Platja_de_la_Barceloneta%2C_Barcelona%2C_2015.jpg",
}

UA_HEADERS = {"User-Agent": "TripCazador/1.0 (contacto@tripcazador.com)"}


def ensure_logo_pngs() -> None:
    """Pre-render the radar SVG to two PNG sizes (cached in /tmp)."""
    svg_bytes = LOGO_SVG.read_bytes()
    if not LOGO_PNG_SMALL.exists():
        cairosvg.svg2png(
            bytestring=svg_bytes,
            write_to=str(LOGO_PNG_SMALL),
            output_width=120,
            output_height=120,
        )
    if not LOGO_PNG_MED.exists():
        cairosvg.svg2png(
            bytestring=svg_bytes,
            write_to=str(LOGO_PNG_MED),
            output_width=240,
            output_height=240,
        )


def paste_logo(img: Image.Image, x: int, y: int, size: int) -> Image.Image:
    """Paste the radar logo (with rounded square navy bg) at (x, y) size×size."""
    src = LOGO_PNG_MED if size > 140 else LOGO_PNG_SMALL
    logo = Image.open(src).convert("RGBA")
    if logo.size[0] != size:
        logo = logo.resize((size, size), Image.LANCZOS)
    img_rgba = img.convert("RGBA")
    img_rgba.paste(logo, (x, y), logo)
    return img_rgba.convert("RGB")


def fetch(key_or_url, w=W, h=H):
    url = key_or_url if key_or_url.startswith("http") else PHOTOS[key_or_url]
    r = requests.get(url, headers=UA_HEADERS, timeout=30)
    r.raise_for_status()
    img = Image.open(BytesIO(r.content)).convert("RGB")
    src_w, src_h = img.size
    target_ratio = w / h
    src_ratio = src_w / src_h
    if src_ratio > target_ratio:
        new_w = int(src_h * target_ratio)
        offset = (src_w - new_w) // 2
        img = img.crop((offset, 0, offset + new_w, src_h))
    else:
        new_h = int(src_w / target_ratio)
        offset = (src_h - new_h) // 2
        img = img.crop((0, offset, src_w, offset + new_h))
    return img.resize((w, h), Image.LANCZOS)


def text_w(draw, text, font):
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[2] - bb[0]


def text_h(draw, text, font):
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[3] - bb[1]


def wrap_text(text, font, max_width, draw):
    words = text.split()
    lines, cur = [], []
    for w_ in words:
        trial = " ".join(cur + [w_])
        if text_w(draw, trial, font) <= max_width:
            cur.append(w_)
        else:
            if cur:
                lines.append(" ".join(cur))
            cur = [w_]
    if cur:
        lines.append(" ".join(cur))
    return lines


def torn_paper_polygon(card_x, card_y, card_w, card_h, jitter=14, n=26, seed=7):
    random.seed(seed)
    top_pts, bot_pts = [], []
    for i in range(n + 1):
        t = i / n
        x = card_x + int(t * card_w)
        ty = card_y + random.randint(-jitter, jitter)
        by = card_y + card_h + random.randint(-jitter, jitter)
        top_pts.append((x, ty))
        bot_pts.append((x, by))
    return top_pts + list(reversed(bot_pts))


def add_drop_shadow(img, card_x, card_y, card_w, card_h, blur=18, alpha=80):
    shadow = Image.new("RGBA", (card_w + 80, card_h + 80), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rectangle((40, 40, card_w + 40, card_h + 40), fill=(0, 0, 0, alpha))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=blur))
    img_rgba = img.convert("RGBA")
    img_rgba.paste(shadow, (card_x - 40, card_y - 35), shadow)
    return img_rgba.convert("RGB")


def torn_paper_card(img, card_x, card_y, card_w, card_h, seed=7):
    img = add_drop_shadow(img, card_x, card_y, card_w, card_h, blur=20, alpha=85)
    draw = ImageDraw.Draw(img, "RGBA")
    polygon = torn_paper_polygon(card_x, card_y, card_w, card_h, jitter=12, n=24, seed=seed)
    draw.polygon(polygon, fill=PAPER)
    draw.polygon(polygon, outline=(220, 215, 205), width=1)
    return img


def draw_corner_marks(draw, color=AMBER, size=35, margin=42):
    for cx, cy in [(margin, margin), (W - margin, margin),
                   (margin, H - margin), (W - margin, H - margin)]:
        if cx == margin:
            draw.line([(cx, cy), (cx + size, cy)], fill=color, width=3)
        else:
            draw.line([(cx - size, cy), (cx, cy)], fill=color, width=3)
        if cy == margin:
            draw.line([(cx, cy), (cx, cy + size)], fill=color, width=3)
        else:
            draw.line([(cx, cy - size), (cx, cy)], fill=color, width=3)


# ─── PLATE 1 — EDITORIAL HERO WITH LOGO + PROMINENT PRICE ───────────


def plate_1_hero():
    strip_keys = ["sagrada", "guell", "batllo", "born", "barceloneta"]
    n = len(strip_keys)
    strip_w = W // n
    bg = Image.new("RGB", (W, H), NAVY)
    for i, key in enumerate(strip_keys):
        photo = fetch(key, w=strip_w + 100, h=H)
        offset = ((strip_w + 100) - strip_w) // 2
        photo = photo.crop((offset, 0, offset + strip_w, H))
        bg.paste(photo, (i * strip_w, 0))
    sdraw = ImageDraw.Draw(bg)
    for i in range(1, n):
        x = i * strip_w
        sdraw.line([(x, 0), (x, H)], fill=(255, 255, 255), width=1)
    bg = bg.filter(ImageFilter.GaussianBlur(radius=0.5))
    base = bg.convert("RGBA")
    grad = Image.new("RGBA", base.size, (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grad)
    for y in range(H):
        t = y / (H - 1)
        a = int(110 + (245 - 110) * t)
        gdraw.line([(0, y), (W, y)], fill=(10, 21, 48, a))
    base.alpha_composite(grad)
    img = base.convert("RGB")

    # ── LOGO RADAR — ARRIBA IZQUIERDA, MEDIANO ──
    img = paste_logo(img, x=50, y=50, size=140)

    draw = ImageDraw.Draw(img, "RGBA")
    draw_corner_marks(draw, AMBER, 35, 42)

    # Plate label — desplazado a la derecha del logo
    fnt_label = ImageFont.truetype(F_SANS_MONO, 18)
    draw.text((210, 78), "PLATE  I  ·  CHOLLO  DETECTADO", font=fnt_label, fill=AMBER)
    draw.text((210, 110), "BARCELONA  ·  41°24′ N · 02°10′ E", font=fnt_label, fill=WHITE_DIM)

    # City name (aligned center, started slightly lower since logo took top space)
    fnt_city = ImageFont.truetype(F_SERIF_BOLD, 110)
    city = "BARCELONA"
    tw = text_w(draw, city, fnt_city)
    draw.text(((W - tw) // 2, 230), city, font=fnt_city, fill=WHITE)

    fnt_sub = ImageFont.truetype(F_SERIF_ITAL, 28)
    sub = "Cinco lugares imprescindibles · y un precio cazado que lo paga todo"
    sw = text_w(draw, sub, fnt_sub)
    while sw > W - 80:
        size = fnt_sub.size - 2
        if size < 22:
            break
        fnt_sub = ImageFont.truetype(F_SERIF_ITAL, size)
        sw = text_w(draw, sub, fnt_sub)
    draw.text(((W - sw) // 2, 365), sub, font=fnt_sub, fill=WHITE_DIM)

    # ── BIG PRICE PANEL ──
    panel_x, panel_y, panel_w, panel_h = 80, 450, W - 160, 430
    panel = Image.new("RGBA", (panel_w, panel_h), (10, 21, 48, 245))
    img_rgba = img.convert("RGBA")
    img_rgba.paste(panel, (panel_x, panel_y), panel)
    img = img_rgba.convert("RGB")
    draw = ImageDraw.Draw(img, "RGBA")
    draw.rectangle(
        [(panel_x, panel_y), (panel_x + panel_w, panel_y + panel_h)],
        outline=AMBER, width=6,
    )

    fnt_label2 = ImageFont.truetype(F_SANS_BOLD, 22)
    draw.text(
        (panel_x + (panel_w - text_w(draw, "DESDE", fnt_label2)) // 2, panel_y + 28),
        "DESDE", font=fnt_label2, fill=AMBER,
    )

    fnt_price = ImageFont.truetype(F_SERIF_BOLD, 230)
    price = "79€"
    pw = text_w(draw, price, fnt_price)
    draw.text(((W - pw) // 2, panel_y + 60), price, font=fnt_price, fill=AMBER)

    fnt_route = ImageFont.truetype(F_SERIF_BOLD, 38)
    route = "Múnich  →  Barcelona"
    rw = text_w(draw, route, fnt_route)
    draw.text(((W - rw) // 2, panel_y + 295), route, font=fnt_route, fill=WHITE)

    fnt_meta = ImageFont.truetype(F_SANS, 19)
    meta = "VUELING  ·  IDA 08 jun  →  VUELTA 12 jun  ·  4 noches  ·  directo  2 h 15 m"
    mw = text_w(draw, meta, fnt_meta)
    while mw > panel_w - 40:
        size = fnt_meta.size - 1
        if size < 14: break
        fnt_meta = ImageFont.truetype(F_SANS, size)
        mw = text_w(draw, meta, fnt_meta)
    draw.text(((W - mw) // 2, panel_y + 348), meta, font=fnt_meta, fill=WHITE_DIM)

    fnt_hook = ImageFont.truetype(F_SERIF_ITAL, 22)
    hook = "¿Listo para que en 2 h 15 m estés conociendo 5 lugares increíbles?"
    hw = text_w(draw, hook, fnt_hook)
    while hw > panel_w - 40:
        size = fnt_hook.size - 1
        if size < 16: break
        fnt_hook = ImageFont.truetype(F_SERIF_ITAL, size)
        hw = text_w(draw, hook, fnt_hook)
    draw.text(((W - hw) // 2, panel_y + 388), hook, font=fnt_hook, fill=AMBER)

    # ── BOTTOM STRIP — logo small + URL central ──
    strip_h = 110
    strip_y = H - strip_h
    draw.rectangle([(0, strip_y), (W, H)], fill=(10, 21, 48, 240))
    draw.rectangle([(0, strip_y - 4), (W, strip_y)], fill=AMBER)

    # logo small en strip izquierda
    img = paste_logo(img, x=40, y=strip_y + 12, size=86)
    draw = ImageDraw.Draw(img, "RGBA")

    # URL centered protagonista
    fnt_url = ImageFont.truetype(F_SANS_BOLD, 36)
    url = "tripcazador.com"
    uw = text_w(draw, url, fnt_url)
    draw.text(((W - uw) // 2, strip_y + 30), url, font=fnt_url, fill=AMBER)

    # @handle + desliza right
    fnt_handle = ImageFont.truetype(F_SANS, 17)
    handle = "@tripcazador  ·  desliza  →"
    hh_w = text_w(draw, handle, fnt_handle)
    draw.text((W - 50 - hh_w, strip_y + 75), handle, font=fnt_handle, fill=WHITE_DIM)

    # Tagline left below logo
    fnt_tagline = ImageFont.truetype(F_SANS, 13)
    draw.text((140, strip_y + 75), "EL CAZADOR DE CHOLLOS", font=fnt_tagline, fill=WHITE_DIM)

    img.save(OUT / "1_hero_sagrada.png", "PNG", quality=95)
    print("✓ Plate 1 (hero + radar logo) saved")


# ─── PLATES 2-5 — TAGANGA STYLE + LOGO EN STRIP ─────────────────


def taganga_plate(plate_num, photo_key, title, description, label_top, coord, filename, seed=7):
    bg = fetch(PHOTOS[photo_key])
    img = bg.convert("RGB")

    enhancer_img = img.convert("RGBA")
    tint = Image.new("RGBA", img.size, (10, 21, 48, 30))
    enhancer_img.alpha_composite(tint)
    img = enhancer_img.convert("RGB")

    draw = ImageDraw.Draw(img, "RGBA")

    fnt_label = ImageFont.truetype(F_SANS_MONO, 14)
    label_pill_pad = 12
    lw = text_w(draw, label_top, fnt_label)
    pill_x, pill_y = 50, 50
    draw.rounded_rectangle(
        [(pill_x, pill_y), (pill_x + lw + label_pill_pad * 2, pill_y + 32)],
        radius=16, fill=(10, 21, 48, 200),
    )
    draw.text((pill_x + label_pill_pad, pill_y + 8), label_top, font=fnt_label, fill=AMBER)

    cw = text_w(draw, coord, fnt_label)
    pill_rx = W - 50 - cw - label_pill_pad * 2
    draw.rounded_rectangle(
        [(pill_rx, pill_y), (W - 50, pill_y + 32)],
        radius=16, fill=(10, 21, 48, 200),
    )
    draw.text((pill_rx + label_pill_pad, pill_y + 8), coord, font=fnt_label, fill=WHITE_DIM)

    # ── TORN PAPER CARD ──
    card_w = 820
    card_h = 320
    card_x = (W - card_w) // 2
    card_y = (H - card_h) // 2 - 30

    img = torn_paper_card(img, card_x, card_y, card_w, card_h, seed=seed)
    draw = ImageDraw.Draw(img, "RGBA")

    fnt_title = ImageFont.truetype(F_SERIF_BOLD_ITAL, 64)
    while text_w(draw, title, fnt_title) > card_w - 80:
        size = fnt_title.size - 4
        if size < 38: break
        fnt_title = ImageFont.truetype(F_SERIF_BOLD_ITAL, size)
    tw = text_w(draw, title, fnt_title)
    draw.text(((W - tw) // 2, card_y + 40), title, font=fnt_title, fill=TERRACOTTA)

    th = text_h(draw, title, fnt_title)
    line_y = card_y + 40 + th + 16
    line_x1 = (W - tw) // 2 + 30
    line_x2 = line_x1 + tw - 60
    draw.line([(line_x1, line_y), (line_x2, line_y)], fill=TERRACOTTA, width=1)

    fnt_desc = ImageFont.truetype(F_SERIF, 22)
    max_text_w = card_w - 100
    lines = wrap_text(description, fnt_desc, max_text_w, draw)
    line_height = 32
    desc_y = card_y + 160
    for i, ln in enumerate(lines):
        lw = text_w(draw, ln, fnt_desc)
        draw.text(((W - lw) // 2, desc_y + i * line_height), ln, font=fnt_desc, fill=NAVY)

    # ── BOTTOM STRIP CON LOGO ──
    strip_h = 110
    strip_y = H - strip_h
    draw.rectangle([(0, strip_y), (W, H)], fill=(10, 21, 48, 240))
    draw.rectangle([(0, strip_y - 3), (W, strip_y)], fill=AMBER)

    # Logo small left
    img = paste_logo(img, x=40, y=strip_y + 12, size=86)
    draw = ImageDraw.Draw(img, "RGBA")

    # URL centered
    fnt_url = ImageFont.truetype(F_SANS_BOLD, 28)
    url = "tripcazador.com"
    uw = text_w(draw, url, fnt_url)
    draw.text(((W - uw) // 2, strip_y + 32), url, font=fnt_url, fill=AMBER)

    # Handle below
    fnt_handle = ImageFont.truetype(F_SANS, 16)
    handle = "@tripcazador  ·  EL CAZADOR DE CHOLLOS"
    hh_w = text_w(draw, handle, fnt_handle)
    draw.text(((W - hh_w) // 2, strip_y + 70), handle, font=fnt_handle, fill=WHITE_DIM)

    # Plate number top-right of strip
    fnt_num = ImageFont.truetype(F_SANS_MONO, 16)
    num_text = f"{plate_num:02d} / 05"
    nw = text_w(draw, num_text, fnt_num)
    draw.text((W - 50 - nw, strip_y + 50), num_text, font=fnt_num, fill=AMBER)

    img.save(OUT / filename, "PNG", quality=95)
    print(f"✓ Plate {plate_num} (taganga + radar logo) saved → {filename}")


def main():
    ensure_logo_pngs()

    plate_1_hero()

    taganga_plate(
        plate_num=2,
        photo_key="guell",
        title="Park Güell, Barcelona",
        description=(
            "El jardín que Gaudí pintó con cerámica rota. Reserva online — "
            "la cola in situ supera 2h en alta temporada. Entrada 13€, abre 08:30."
        ),
        label_top="LUGAR  Nº 1  ·  ALTA",
        coord="41°24′ N · 02°09′ E",
        filename="2_park_guell.png",
        seed=11,
    )

    taganga_plate(
        plate_num=3,
        photo_key="batllo",
        title="Casa Batlló, Eixample",
        description=(
            "Modernismo en la espina del Eixample. Combo con Sagrada Familia "
            "y Park Güell desde 65€ — ahorras 22€ frente a entradas sueltas."
        ),
        label_top="LUGAR  Nº 2  ·  MODERNISMO",
        coord="41°23′ N · 02°09′ E",
        filename="3_casa_batllo.png",
        seed=22,
    )

    taganga_plate(
        plate_num=4,
        photo_key="born",
        title="El Born, Gòtico",
        description=(
            "El barrio donde se come y se bebe la ciudad. Menú del día 13-17€, "
            "vermut a 3,50€. Evita Las Ramblas: los locales del Born sirven "
            "mejor a mitad de precio."
        ),
        label_top="LUGAR  Nº 3  ·  GASTRO",
        coord="41°23′ N · 02°10′ E",
        filename="4_born_tapas.png",
        seed=33,
    )

    taganga_plate(
        plate_num=5,
        photo_key="barceloneta",
        title="Barceloneta, Mediterráneo",
        description=(
            "Playa caminable desde el centro: metro L4 te deja en 15 min "
            "desde plaza Catalunya. Paella en chiringuito al atardecer y "
            "el próximo chollo ya está saliendo en tripcazador.com."
        ),
        label_top="LUGAR  Nº 4  ·  CIERRE",
        coord="41°22′ N · 02°11′ E",
        filename="5_cta_barceloneta.png",
        seed=44,
    )


if __name__ == "__main__":
    main()
