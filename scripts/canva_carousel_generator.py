#!/usr/bin/env python3
"""
canva_carousel_generator.py — fase SSS75 (May 2026)

Generador en runtime del carrusel IG estilo Canva Barcelona reference
(canva_propuesta_barcelona/*.png). Port de canva_barcelona_v3.py
parametrizado por deal.

Inputs (env vars o CLI):
  --out-dir            Directorio donde escribir 1.png..5.png
  --dest-key           Slug del destino (lookup en canva_landmarks.LANDMARKS)
  --route-from         Nombre ciudad origen (ej. "Múnich")
  --route-to           Nombre ciudad destino (ej. "Barcelona")
  --price              Precio actual EUR (int)
  --old-price          Precio antes EUR (int) — opcional
  --savings-pct        % ahorro (int) — opcional
  --date-out           "DD MMM" (ej. "08 jun") — opcional
  --date-ret           "DD MMM" — opcional
  --nights             int — opcional
  --airline            "VUELING" — opcional
  --duration-str       "2 h 15 m" — opcional
  --stops              int — opcional
  --coord              "41°24′ N · 02°10′ E" — opcional
  --fallback-photo     URL si dest-key no está en catalog

Output: 5 PNGs 1080×1080 en out-dir nombrados 1.png..5.png.

Dependencias: Pillow, cairosvg, requests, sys.path canva_landmarks.
"""
import argparse
import os
import random
import sys
from io import BytesIO
from pathlib import Path
from typing import Optional, Tuple, List

import requests
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Add scripts/ to path para import sibling
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from canva_landmarks import get_landmarks, fallback_landmarks, DestinationLandmarks  # noqa: E402

# ─── PALETTE ──────────────────────────────────────────────────────
NAVY = (10, 21, 48)
AMBER = (251, 191, 36)
WHITE = (255, 255, 255)
WHITE_DIM = (235, 235, 235)
TERRACOTTA = (200, 60, 50)
PAPER = (250, 248, 243)
NAVY_RGBA = (10, 21, 48, 245)

# ─── FONTS (DejaVu disponible en ubuntu-latest GH runners) ────────
F_SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
F_SERIF_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
F_SERIF_ITAL = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf"
F_SERIF_BOLD_ITAL = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-BoldItalic.ttf"
F_SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
F_SANS_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
F_SANS_MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

W = H = 1080
UA_HEADERS = {"User-Agent": "TripCazador/1.0 (contacto@tripcazador.com)"}

# Logo radar A1 — pre-renderizado del SVG
LOGO_PNG_SMALL = Path("/tmp/tripcazador_logo_120.png")
LOGO_PNG_MED = Path("/tmp/tripcazador_logo_240.png")


# ─── HELPERS ──────────────────────────────────────────────────────


def ensure_logo_pngs(svg_path: Path) -> None:
    """Pre-render radar logo SVG → 2 PNG sizes (cached in /tmp)."""
    if not svg_path.exists():
        print(f"WARN: logo SVG not found at {svg_path} — skipping logo paste")
        return
    try:
        import cairosvg  # type: ignore
    except ImportError:
        print("WARN: cairosvg not installed — skipping logo paste")
        return
    svg_bytes = svg_path.read_bytes()
    if not LOGO_PNG_SMALL.exists():
        cairosvg.svg2png(
            bytestring=svg_bytes, write_to=str(LOGO_PNG_SMALL),
            output_width=120, output_height=120,
        )
    if not LOGO_PNG_MED.exists():
        cairosvg.svg2png(
            bytestring=svg_bytes, write_to=str(LOGO_PNG_MED),
            output_width=240, output_height=240,
        )


def paste_logo(img: Image.Image, x: int, y: int, size: int) -> Image.Image:
    """Paste radar logo at (x, y) size×size. Silent if no PNG cached."""
    src = LOGO_PNG_MED if size > 140 else LOGO_PNG_SMALL
    if not src.exists():
        return img
    logo = Image.open(src).convert("RGBA")
    if logo.size[0] != size:
        logo = logo.resize((size, size), Image.LANCZOS)
    rgba = img.convert("RGBA")
    rgba.paste(logo, (x, y), logo)
    return rgba.convert("RGB")


def _fetch_and_crop(url: str, w: int, h: int, retries: int):
    """Helper: descarga + crop + resize. Retorna None si falla todos retries."""
    for attempt in range(retries):
        try:
            r = requests.get(url, headers=UA_HEADERS, timeout=30)
            r.raise_for_status()
            img = Image.open(BytesIO(r.content)).convert("RGB")
            sw, sh = img.size
            target = w / h
            actual = sw / sh
            if actual > target:
                nw = int(sh * target)
                off = (sw - nw) // 2
                img = img.crop((off, 0, off + nw, sh))
            else:
                nh = int(sw / target)
                off = (sh - nh) // 2
                img = img.crop((0, off, sw, off + nh))
            return img.resize((w, h), Image.LANCZOS)
        except Exception as e:
            print(f"WARN: fetch attempt {attempt+1}/{retries} failed for {url[:80]}: {e}")
    return None


# SSS76k: fallback global settable por main args (--fallback-photo)
_GLOBAL_FALLBACK_PHOTO: str = ""


def fetch_photo(url: str, w: int = W, h: int = H, retries: int = 3) -> Image.Image:
    """Download + center-crop + resize to w×h. Retries on transient errors.
    Si falla y hay fallback global setteado, intenta esa URL antes del placeholder navy.
    """
    img = _fetch_and_crop(url, w, h, retries)
    if img is not None:
        return img
    # SSS76k: chain de fallback antes de placeholder navy
    if _GLOBAL_FALLBACK_PHOTO and _GLOBAL_FALLBACK_PHOTO != url:
        print(f"INFO: trying global fallback {_GLOBAL_FALLBACK_PHOTO[:80]}")
        img = _fetch_and_crop(_GLOBAL_FALLBACK_PHOTO, w, h, retries=2)
        if img is not None:
            return img
    print(f"ERROR: all fetch retries failed, using navy placeholder")
    return Image.new("RGB", (w, h), NAVY)


def text_w(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> int:
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[2] - bb[0]


def text_h(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> int:
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[3] - bb[1]


def wrap_text(text: str, font, max_width: int, draw) -> List[str]:
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


def torn_paper_polygon(card_x, card_y, card_w, card_h, jitter=12, n=24, seed=7):
    random.seed(seed)
    top, bot = [], []
    for i in range(n + 1):
        t = i / n
        x = card_x + int(t * card_w)
        ty = card_y + random.randint(-jitter, jitter)
        by = card_y + card_h + random.randint(-jitter, jitter)
        top.append((x, ty))
        bot.append((x, by))
    return top + list(reversed(bot))


def add_drop_shadow(img, card_x, card_y, card_w, card_h, blur=20, alpha=85):
    shadow = Image.new("RGBA", (card_w + 80, card_h + 80), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rectangle((40, 40, card_w + 40, card_h + 40), fill=(0, 0, 0, alpha))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=blur))
    rgba = img.convert("RGBA")
    rgba.paste(shadow, (card_x - 40, card_y - 35), shadow)
    return rgba.convert("RGB")


def torn_paper_card(img, card_x, card_y, card_w, card_h, seed=7):
    img = add_drop_shadow(img, card_x, card_y, card_w, card_h, blur=20, alpha=85)
    draw = ImageDraw.Draw(img, "RGBA")
    poly = torn_paper_polygon(card_x, card_y, card_w, card_h, jitter=12, n=24, seed=seed)
    draw.polygon(poly, fill=PAPER)
    draw.polygon(poly, outline=(220, 215, 205), width=1)
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


def bottom_strip(img, plate_num: int, total: int = 5) -> Image.Image:
    """Strip ámbar inferior con logo + URL + plate N/05."""
    strip_h = 110
    strip_y = H - strip_h
    draw = ImageDraw.Draw(img, "RGBA")
    draw.rectangle([(0, strip_y), (W, H)], fill=(10, 21, 48, 240))
    draw.rectangle([(0, strip_y - 4), (W, strip_y)], fill=AMBER)

    # Logo small left
    img = paste_logo(img, x=40, y=strip_y + 12, size=86)
    draw = ImageDraw.Draw(img, "RGBA")

    # URL center
    fnt_url = ImageFont.truetype(F_SANS_BOLD, 32)
    url = "tripcazador.com"
    uw = text_w(draw, url, fnt_url)
    draw.text(((W - uw) // 2, strip_y + 30), url, font=fnt_url, fill=AMBER)

    # Handle below
    fnt_handle = ImageFont.truetype(F_SANS, 16)
    handle = "@tripcazador  ·  EL CAZADOR DE CHOLLOS"
    hw = text_w(draw, handle, fnt_handle)
    draw.text(((W - hw) // 2, strip_y + 70), handle, font=fnt_handle, fill=WHITE_DIM)

    # Plate number top-right of strip
    fnt_num = ImageFont.truetype(F_SANS_MONO, 16)
    num_text = f"{plate_num:02d} / {total:02d}"
    nw = text_w(draw, num_text, fnt_num)
    draw.text((W - 50 - nw, strip_y + 50), num_text, font=fnt_num, fill=AMBER)

    return img


# ─── PLATE I — HERO ───────────────────────────────────────────────


def render_plate_1(
    out_path: Path,
    landmarks: DestinationLandmarks,
    route_from: str,
    route_to: str,
    price: int,
    old_price: Optional[int],
    savings_pct: Optional[int],
    date_out: Optional[str],
    date_ret: Optional[str],
    nights: Optional[int],
    airline: Optional[str],
    duration_str: Optional[str],
    stops: int,
    coord: Optional[str],
) -> None:
    strip_keys = landmarks["hero_strips"][:5]
    n = len(strip_keys)
    strip_w = W // n if n else W
    bg = Image.new("RGB", (W, H), NAVY)
    for i, url in enumerate(strip_keys):
        photo = fetch_photo(url, w=strip_w + 100, h=H)
        offset = ((strip_w + 100) - strip_w) // 2
        photo = photo.crop((offset, 0, offset + strip_w, H))
        bg.paste(photo, (i * strip_w, 0))
    sd = ImageDraw.Draw(bg)
    for i in range(1, n):
        x = i * strip_w
        sd.line([(x, 0), (x, H)], fill=(255, 255, 255), width=1)
    bg = bg.filter(ImageFilter.GaussianBlur(radius=0.5))

    # Gradient navy bottom-up
    base = bg.convert("RGBA")
    grad = Image.new("RGBA", base.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for y in range(H):
        t = y / (H - 1)
        a = int(110 + (245 - 110) * t)
        gd.line([(0, y), (W, y)], fill=(10, 21, 48, a))
    base.alpha_composite(grad)
    img = base.convert("RGB")

    # Logo radar TL grande
    img = paste_logo(img, x=50, y=50, size=140)

    draw = ImageDraw.Draw(img, "RGBA")
    draw_corner_marks(draw, AMBER, 35, 42)

    # Plate label
    fnt_label = ImageFont.truetype(F_SANS_MONO, 18)
    draw.text((210, 78), "PLATE  I  ·  CHOLLO  DETECTADO", font=fnt_label, fill=AMBER)
    coord_line = f"{route_to.upper()}  ·  {coord}" if coord else route_to.upper()
    draw.text((210, 110), coord_line, font=fnt_label, fill=WHITE_DIM)

    # City name SERIF — tamaño base reducido a 92 para que el nombre se vea
    # bien al completo en el thumbnail del feed (sin entrar al post).
    # Ciudades cortas (Roma, Bali) usan 92, ciudades largas (Palma de Mallorca)
    # se reducen automáticamente con el while-loop de fitting.
    fnt_city = ImageFont.truetype(F_SERIF_BOLD, 92)
    city = route_to.upper()
    while text_w(draw, city, fnt_city) > W - 100:
        size = fnt_city.size - 4
        if size < 56:
            break
        fnt_city = ImageFont.truetype(F_SERIF_BOLD, size)
    tw = text_w(draw, city, fnt_city)
    # bajar un poco el y porque el font es más pequeño
    draw.text(((W - tw) // 2, 250), city, font=fnt_city, fill=WHITE)

    # Subtitle italic
    fnt_sub = ImageFont.truetype(F_SERIF_ITAL, 28)
    sub = landmarks["hero_subtitle"]
    while text_w(draw, sub, fnt_sub) > W - 80:
        size = fnt_sub.size - 2
        if size < 22:
            break
        fnt_sub = ImageFont.truetype(F_SERIF_ITAL, size)
    sw = text_w(draw, sub, fnt_sub)
    draw.text(((W - sw) // 2, 365), sub, font=fnt_sub, fill=WHITE_DIM)

    # ── BIG PRICE PANEL ──
    # SSS84: panel_h 430→470 para que el hook ("Ruta directa hacia X")
    # respire 40px del border amber abajo en vez de tocarlo.
    panel_x, panel_y, panel_w, panel_h = 80, 450, W - 160, 470
    panel = Image.new("RGBA", (panel_w, panel_h), NAVY_RGBA)
    rgba = img.convert("RGBA")
    rgba.paste(panel, (panel_x, panel_y), panel)
    img = rgba.convert("RGB")
    draw = ImageDraw.Draw(img, "RGBA")
    draw.rectangle(
        [(panel_x, panel_y), (panel_x + panel_w, panel_y + panel_h)],
        outline=AMBER, width=6,
    )

    fnt_l2 = ImageFont.truetype(F_SANS_BOLD, 22)
    draw.text(
        (panel_x + (panel_w - text_w(draw, "DESDE", fnt_l2)) // 2, panel_y + 28),
        "DESDE", font=fnt_l2, fill=AMBER,
    )

    # SSS84 (May 2026): "antes XXX€ · ahorras YY€ · -ZZ%" se posiciona ARRIBA
    # del precio gigante (entre DESDE y el precio), no debajo. Antes intentábamos
    # ponerlo debajo midiendo el bbox del precio, pero el descender del €
    # solapaba con la línea de tachado. Ahora va arriba y nunca solapa.
    if old_price and old_price > price:
        fnt_old = ImageFont.truetype(F_SANS, 17)
        old_text = f"antes {old_price}€"
        savings_text = (
            f"  ↓ ahorras {old_price - price}€  ·  −{savings_pct}%"
            if savings_pct else f"  ↓ ahorras {old_price - price}€"
        )
        old_w = text_w(draw, old_text, fnt_old)
        sav_w = text_w(draw, savings_text, fnt_old)
        total_w = old_w + sav_w
        old_x = (W - total_w) // 2
        old_y = panel_y + 58  # justo bajo "DESDE", arriba del precio
        # Tachado SOLO en "antes XXX€"
        draw.text((old_x, old_y), old_text, font=fnt_old, fill=(180, 180, 180))
        draw.line(
            [(old_x, old_y + 11), (old_x + old_w, old_y + 11)],
            fill=(180, 180, 180), width=2,
        )
        draw.text((old_x + old_w, old_y), savings_text, font=fnt_old, fill=AMBER)
        price_y = panel_y + 95  # bajo "antes/ahorras"
    else:
        price_y = panel_y + 70  # sin old_price: precio justo bajo DESDE

    fnt_price = ImageFont.truetype(F_SERIF_BOLD, 220)
    price_str = f"{price}€"
    pw = text_w(draw, price_str, fnt_price)
    draw.text(((W - pw) // 2, price_y), price_str, font=fnt_price, fill=AMBER)

    # Ruta — empujada a 340 para que el panel_h=470 quede balanceado
    fnt_route = ImageFont.truetype(F_SERIF_BOLD, 38)
    route = f"{route_from}  →  {route_to}"
    rw = text_w(draw, route, fnt_route)
    draw.text(((W - rw) // 2, panel_y + 340), route, font=fnt_route, fill=WHITE)

    # Meta line
    parts = []
    if airline:
        parts.append(airline.upper())
    if date_out and date_ret:
        parts.append(f"IDA {date_out}  →  VUELTA {date_ret}")
    elif date_out:
        parts.append(f"IDA {date_out}")
    if nights and nights > 0:
        parts.append(f"{nights} {'noche' if nights == 1 else 'noches'}")
    if duration_str:
        if stops == 0:
            parts.append(f"directo  {duration_str}")
        else:
            parts.append(f"{stops} {'escala' if stops == 1 else 'escalas'} · {duration_str}")
    meta = "  ·  ".join(parts)
    fnt_meta = ImageFont.truetype(F_SANS, 19)
    while text_w(draw, meta, fnt_meta) > panel_w - 40:
        size = fnt_meta.size - 1
        if size < 14:
            break
        fnt_meta = ImageFont.truetype(F_SANS, size)
    mw = text_w(draw, meta, fnt_meta)
    draw.text(((W - mw) // 2, panel_y + 392), meta, font=fnt_meta, fill=WHITE_DIM)

    # Hook
    if duration_str and stops == 0:
        hook = f"¿Listo para que en {duration_str} estés conociendo {route_to}?"
    elif nights and nights > 0:
        hook = f"{nights} {'noche' if nights == 1 else 'noches'} en {route_to}, ida y vuelta incluidos"
    else:
        hook = f"Ruta directa hacia {route_to}, sin sorpresas"
    fnt_hook = ImageFont.truetype(F_SERIF_ITAL, 22)
    while text_w(draw, hook, fnt_hook) > panel_w - 40:
        size = fnt_hook.size - 1
        if size < 16:
            break
        fnt_hook = ImageFont.truetype(F_SERIF_ITAL, size)
    hw = text_w(draw, hook, fnt_hook)
    # SSS84: hook a 428 para dejar 22px de aire al border amber del panel
    # (panel_h=470, hook_font=22, ends at 428+22=450 → bottom margin = 20)
    draw.text(((W - hw) // 2, panel_y + 428), hook, font=fnt_hook, fill=AMBER)

    # Bottom strip
    img = bottom_strip(img, plate_num=1)

    img.save(out_path, "PNG", quality=95)
    print(f"✓ Plate 1 saved → {out_path}")


# ─── PLATES II-V — TAGANGA TORN PAPER ─────────────────────────────


def render_taganga_plate(
    out_path: Path,
    plate_num: int,
    photo_url: str,
    title: str,
    description: str,
    label: str,
    coord: str,
    seed: int = 7,
) -> None:
    bg = fetch_photo(photo_url)
    img = bg.convert("RGB")

    # Tint navy 30
    enhancer = img.convert("RGBA")
    tint = Image.new("RGBA", img.size, (10, 21, 48, 30))
    enhancer.alpha_composite(tint)
    img = enhancer.convert("RGB")

    draw = ImageDraw.Draw(img, "RGBA")

    # Pills top
    fnt_lbl = ImageFont.truetype(F_SANS_MONO, 14)
    pad = 12
    lw = text_w(draw, label, fnt_lbl)
    px, py = 50, 50
    draw.rounded_rectangle(
        [(px, py), (px + lw + pad * 2, py + 32)],
        radius=16, fill=(10, 21, 48, 200),
    )
    draw.text((px + pad, py + 8), label, font=fnt_lbl, fill=AMBER)

    cw = text_w(draw, coord, fnt_lbl)
    cx = W - 50 - cw - pad * 2
    draw.rounded_rectangle(
        [(cx, py), (W - 50, py + 32)],
        radius=16, fill=(10, 21, 48, 200),
    )
    draw.text((cx + pad, py + 8), coord, font=fnt_lbl, fill=WHITE_DIM)

    # Torn paper card
    card_w = 820
    card_h = 320
    card_x = (W - card_w) // 2
    card_y = (H - card_h) // 2 - 30

    img = torn_paper_card(img, card_x, card_y, card_w, card_h, seed=seed)
    draw = ImageDraw.Draw(img, "RGBA")

    # Title serif italic terracotta
    fnt_title = ImageFont.truetype(F_SERIF_BOLD_ITAL, 64)
    while text_w(draw, title, fnt_title) > card_w - 80:
        size = fnt_title.size - 4
        if size < 38:
            break
        fnt_title = ImageFont.truetype(F_SERIF_BOLD_ITAL, size)
    tw = text_w(draw, title, fnt_title)
    draw.text(((W - tw) // 2, card_y + 40), title, font=fnt_title, fill=TERRACOTTA)

    th = text_h(draw, title, fnt_title)
    line_y = card_y + 40 + th + 16
    line_x1 = (W - tw) // 2 + 30
    line_x2 = line_x1 + tw - 60
    draw.line([(line_x1, line_y), (line_x2, line_y)], fill=TERRACOTTA, width=1)

    # Description
    fnt_desc = ImageFont.truetype(F_SERIF, 22)
    max_text_w = card_w - 100
    lines = wrap_text(description, fnt_desc, max_text_w, draw)
    line_height = 32
    desc_y = card_y + 160
    for i, ln in enumerate(lines):
        lw_ = text_w(draw, ln, fnt_desc)
        draw.text(((W - lw_) // 2, desc_y + i * line_height), ln, font=fnt_desc, fill=NAVY)

    # Bottom strip
    img = bottom_strip(img, plate_num=plate_num)

    img.save(out_path, "PNG", quality=95)
    print(f"✓ Plate {plate_num} saved → {out_path}")


# ─── MAIN ─────────────────────────────────────────────────────────


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--out-dir", required=True, type=Path)
    p.add_argument("--dest-key", required=True)
    p.add_argument("--route-from", required=True)
    p.add_argument("--route-to", required=True)
    p.add_argument("--price", required=True, type=int)
    p.add_argument("--old-price", type=int, default=0)
    p.add_argument("--savings-pct", type=int, default=0)
    p.add_argument("--date-out", default="")
    p.add_argument("--date-ret", default="")
    p.add_argument("--nights", type=int, default=0)
    p.add_argument("--airline", default="")
    p.add_argument("--duration-str", default="")
    p.add_argument("--stops", type=int, default=0)
    p.add_argument("--coord", default="")
    p.add_argument("--fallback-photo", default="")
    p.add_argument(
        "--logo-svg",
        default="tripcazador-web/public/logo-a1-primary.svg",
        type=Path,
    )
    # SSS88: skip pre-flight photo resolver (para tests/offline). Por defecto
    # OFF — el resolver corre y busca fotos en Wikipedia si la curada falla.
    p.add_argument(
        "--skip-photo-resolver",
        action="store_true",
        default=False,
        help="Skip Wikipedia photo resolver pre-flight (tests offline)",
    )
    args = p.parse_args()

    args.out_dir.mkdir(parents=True, exist_ok=True)

    # SSS76k: settear fallback global para fetch_photo (antes que cualquier fetch)
    global _GLOBAL_FALLBACK_PHOTO
    _GLOBAL_FALLBACK_PHOTO = args.fallback_photo or ""
    if _GLOBAL_FALLBACK_PHOTO:
        print(f"INFO: global fallback photo = {_GLOBAL_FALLBACK_PHOTO[:80]}")

    # Pre-render logo
    ensure_logo_pngs(args.logo_svg)

    # Resolve landmarks
    landmarks = get_landmarks(args.dest_key)
    if not landmarks:
        if not args.fallback_photo:
            print(f"ERROR: dest-key '{args.dest_key}' not in catalog and no --fallback-photo provided")
            return 2
        print(f"INFO: dest-key '{args.dest_key}' not in catalog, using generic fallback")
        landmarks = fallback_landmarks(args.dest_key, args.fallback_photo)

    # SSS88: Pre-flight photo resolver — para CADA slide, valida que la URL
    # cargue; si no, busca la imagen del lugar en Wikipedia API + cachea.
    # Esto garantiza que NUNCA publiquemos un carrusel con fotos genéricas
    # cuando el lugar concreto (Sagrada Familia, Coliseo, etc.) tiene foto
    # disponible en Wikipedia.
    if args.skip_photo_resolver:
        print("INFO: --skip-photo-resolver activo (modo offline/test)")
    else:
        try:
            from place_photo_resolver import resolve_landmarks_inplace
            resolve_landmarks_inplace(landmarks, default_fallback=args.fallback_photo or "")
        except ImportError as e:
            print(f"WARN: place_photo_resolver no disponible ({e}) — siguiendo sin pre-flight")
        except Exception as e:
            print(f"WARN: place_photo_resolver crash ({e}) — siguiendo con landmarks raw")

    # Plate 1
    render_plate_1(
        out_path=args.out_dir / "1.png",
        landmarks=landmarks,
        route_from=args.route_from,
        route_to=args.route_to,
        price=args.price,
        old_price=args.old_price or None,
        savings_pct=args.savings_pct or None,
        date_out=args.date_out or None,
        date_ret=args.date_ret or None,
        nights=args.nights or None,
        airline=args.airline or None,
        duration_str=args.duration_str or None,
        stops=args.stops,
        coord=args.coord or None,
    )

    # Plates 2-5
    for plate_num, key, seed in [
        (2, "places", 11),
        (3, "food", 22),
        (4, "tips", 33),
        (5, "cta", 44),
    ]:
        plate = landmarks[key]
        render_taganga_plate(
            out_path=args.out_dir / f"{plate_num}.png",
            plate_num=plate_num,
            photo_url=plate["photo"],
            title=plate["name"],
            description=plate["desc"],
            label=plate["label"],
            coord=plate["coord"],
            seed=seed,
        )

    print(f"\n✅ 5 plates rendered to {args.out_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
