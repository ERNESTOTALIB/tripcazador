"""
TripCazador — Brand Guide PDF (~8 pages)
Uses reportlab for vector-quality typography + embedded PNGs.
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

FONTS = "/sessions/laughing-modest-bohr/mnt/.claude/skills/canvas-design/canvas-fonts"
pdfmetrics.registerFont(TTFont("JB", os.path.join(FONTS, "JetBrainsMono-Regular.ttf")))
pdfmetrics.registerFont(TTFont("JBb", os.path.join(FONTS, "JetBrainsMono-Bold.ttf")))
pdfmetrics.registerFont(TTFont("WS", os.path.join(FONTS, "WorkSans-Regular.ttf")))
pdfmetrics.registerFont(TTFont("WSb", os.path.join(FONTS, "WorkSans-Bold.ttf")))
pdfmetrics.registerFont(TTFont("IS", os.path.join(FONTS, "InstrumentSans-Regular.ttf")))
pdfmetrics.registerFont(TTFont("ISb", os.path.join(FONTS, "InstrumentSans-Bold.ttf")))

OUT = "/sessions/laughing-modest-bohr/mnt/Viajes/branding"
PDF_PATH = os.path.join(OUT, "TRIPCAZADOR_BRAND_GUIDE.pdf")

PAGE_W, PAGE_H = A4  # 595 x 842 pt

BG_DARK = (3 / 255, 7 / 255, 18 / 255)
BG_CARD = (15 / 255, 23 / 255, 42 / 255)
AMBER = (245 / 255, 158 / 255, 11 / 255)
AMBER_HI = (251 / 255, 191 / 255, 36 / 255)
TEXT = (229 / 255, 231 / 255, 235 / 255)
MUTED = (156 / 255, 163 / 255, 175 / 255)
SUCCESS = (52 / 255, 211 / 255, 153 / 255)
ERROR = (248 / 255, 113 / 255, 113 / 255)


def fill_bg(c, color=BG_DARK):
    c.setFillColorRGB(*color)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)


def draw_header(c, page_num, section):
    c.setFont("JB", 8)
    c.setFillColorRGB(*MUTED)
    c.drawString(40, PAGE_H - 30, f"TRIPCAZADOR  //  BRAND GUIDE  //  {section}")
    c.drawRightString(PAGE_W - 40, PAGE_H - 30, f"— {page_num:02d} —")
    # top hair rule
    c.setStrokeColorRGB(*AMBER)
    c.setLineWidth(0.5)
    c.line(40, PAGE_H - 40, PAGE_W - 40, PAGE_H - 40)


def draw_footer(c):
    c.setFont("JB", 7)
    c.setFillColorRGB(*MUTED)
    c.drawString(40, 22, "tripcazador.com")
    c.drawRightString(PAGE_W - 40, 22, "v1.0  ·  2026")


# ================= PAGES =================
def page_cover(c):
    fill_bg(c)
    # Large amber corner ticks (frame)
    c.setStrokeColorRGB(*AMBER)
    c.setLineWidth(2)
    tick = 30
    for (x, y, sx, sy) in [
        (40, PAGE_H - 40, 1, -1),
        (PAGE_W - 40, PAGE_H - 40, -1, -1),
        (40, 40, 1, 1),
        (PAGE_W - 40, 40, -1, 1),
    ]:
        c.line(x, y, x + tick * sx, y)
        c.line(x, y, x, y + tick * sy)

    # Logo (hibrido horizontal) centered upper
    logo_path = os.path.join(OUT, "trip_cazador_horizontal_hibrido.png")
    img = ImageReader(logo_path)
    iw, ih = img.getSize()
    target_w = 400
    ratio = target_w / iw
    target_h = ih * ratio
    c.drawImage(logo_path, (PAGE_W - target_w) / 2, PAGE_H / 2 + 30,
                width=target_w, height=target_h, mask="auto")

    # Title block
    c.setFont("ISb", 38)
    c.setFillColorRGB(*TEXT)
    c.drawCentredString(PAGE_W / 2, PAGE_H / 2 - 40, "Brand Guide")

    c.setFont("JB", 11)
    c.setFillColorRGB(*AMBER)
    c.drawCentredString(PAGE_W / 2, PAGE_H / 2 - 70,
                        "identidad visual · voz · aplicaciones")

    # Mono meta block centered lower
    c.setFont("JB", 9)
    c.setFillColorRGB(*MUTED)
    y = 180
    for line in [
        "[ deal_radar // es ]",
        "Versión 1.0  ·  Abril 2026",
        "Dominio: tripcazador.com",
    ]:
        c.drawCentredString(PAGE_W / 2, y, line)
        y -= 16

    # Amber baseline
    c.setFillColorRGB(*AMBER)
    c.rect(PAGE_W / 2 - 30, 100, 60, 3, fill=1, stroke=0)

    draw_footer(c)
    c.showPage()


def page_logos(c):
    fill_bg(c)
    draw_header(c, 2, "LOGO · CONCEPTOS")

    c.setFont("ISb", 28)
    c.setFillColorRGB(*TEXT)
    c.drawString(40, PAGE_H - 80, "Tres caminos. Una misma caza.")

    c.setFont("WS", 11)
    c.setFillColorRGB(*MUTED)
    c.drawString(40, PAGE_H - 100,
                 "Cada concepto expresa un ángulo distinto de la propuesta: motor, instinto y precisión.")

    # Three columns with iso + label
    concepts = [
        ("tech", "TECH", "Radar que detecta.",
         "Motor automático, tech honesto."),
        ("aventura", "AVENTURA", "Rapaz con buen ojo.",
         "Viaje, instinto, carácter."),
        ("hibrido", "HÍBRIDO", "Diana geométrica.",
         "Caza con método. Recomendado."),
    ]

    col_w = (PAGE_W - 80) / 3
    for i, (key, title, sub, rationale) in enumerate(concepts):
        x = 40 + i * col_w
        # Card
        c.setFillColorRGB(*BG_CARD)
        c.roundRect(x + 10, PAGE_H - 470, col_w - 20, 340, 12, fill=1, stroke=0)

        # Iso image
        iso_path = os.path.join(OUT, f"trip_cazador_iso_{key}.png")
        img_size = col_w - 80
        img_x = x + (col_w - img_size) / 2
        c.drawImage(iso_path, img_x, PAGE_H - 350, width=img_size, height=img_size, mask="auto")

        # Title
        c.setFont("JBb", 11)
        c.setFillColorRGB(*AMBER)
        c.drawString(x + 30, PAGE_H - 380, title)

        c.setFont("WSb", 12)
        c.setFillColorRGB(*TEXT)
        c.drawString(x + 30, PAGE_H - 400, sub)

        c.setFont("WS", 9)
        c.setFillColorRGB(*MUTED)
        c.drawString(x + 30, PAGE_H - 420, rationale)

        # Highlight for recommended
        if key == "hibrido":
            c.setStrokeColorRGB(*AMBER)
            c.setLineWidth(1.5)
            c.roundRect(x + 10, PAGE_H - 470, col_w - 20, 340, 12, fill=0, stroke=1)
            c.setFont("JBb", 8)
            c.setFillColorRGB(*AMBER)
            c.drawString(x + 30, PAGE_H - 452, "+ RECOMENDADO")

    # Criteria
    c.setFont("WSb", 12)
    c.setFillColorRGB(*TEXT)
    c.drawString(40, 260, "Criterios de elección")
    c.setFont("WS", 10)
    c.setFillColorRGB(*MUTED)
    criteria = [
        "·  Funciona a tamaños pequeños (favicon 16px).",
        "·  Contraste limpio sobre fondo oscuro y claro.",
        "·  No depende del color para ser reconocible.",
        "·  Comunica caza/precisión sin literalidad infantil.",
        "·  Diferenciable de Skyscanner / Kayak / Viajeros Piratas.",
    ]
    y = 240
    for line in criteria:
        c.drawString(50, y, line)
        y -= 15

    draw_footer(c)
    c.showPage()


def page_palette(c):
    fill_bg(c)
    draw_header(c, 3, "PALETA DE COLORES")

    c.setFont("ISb", 28)
    c.setFillColorRGB(*TEXT)
    c.drawString(40, PAGE_H - 80, "Paleta")

    c.setFont("WS", 11)
    c.setFillColorRGB(*MUTED)
    c.drawString(40, PAGE_H - 100,
                 "Oscuro de base. Ámbar que señala el chollo. Mensajes claros.")

    # Swatches
    swatches = [
        ("Bg / Fondo", "#030712", "rgb(3,7,18)", "c:87 m:81 y:63 k:93", BG_DARK, TEXT,
         "Fondo principal de la web y de todos los assets oscuros."),
        ("Bg / Card", "#0f172a", "rgb(15,23,42)", "c:85 m:74 y:43 k:69", BG_CARD, TEXT,
         "Tarjetas, contenedores elevados, modales."),
        ("Primario / Ámbar", "#f59e0b", "rgb(245,158,11)", "c:0 m:42 y:96 k:0", AMBER, BG_DARK,
         "CTA principal, valores clave, precio, acentos."),
        ("Hover / Ámbar claro", "#fbbf24", "rgb(251,191,36)", "c:0 m:27 y:86 k:0", AMBER_HI, BG_DARK,
         "Hover states y highlights secundarios."),
        ("Texto", "#e5e7eb", "rgb(229,231,235)", "c:5 m:3 y:3 k:0", TEXT, BG_DARK,
         "Texto de lectura principal sobre fondo oscuro."),
        ("Muted", "#9ca3af", "rgb(156,163,175)", "c:36 m:28 y:24 k:3", MUTED, BG_DARK,
         "Texto secundario, labels, metadata."),
        ("Éxito", "#34d399", "rgb(52,211,153)", "c:65 m:0 y:55 k:0", SUCCESS, BG_DARK,
         "Confirmaciones, deals verificados, estados OK."),
        ("Error", "#f87171", "rgb(248,113,113)", "c:0 m:64 y:47 k:0", ERROR, BG_DARK,
         "Avisos, caducado, stock agotado, errores."),
    ]

    x0 = 40
    y0 = PAGE_H - 160
    box_w = PAGE_W - 80
    row_h = 70
    for i, (name, hx, rgb, cmyk, col, fg, desc) in enumerate(swatches):
        y = y0 - i * row_h
        # Swatch
        c.setFillColorRGB(*col)
        c.rect(x0, y - 50, 140, 50, fill=1, stroke=0)
        # Hex inside
        c.setFont("JBb", 11)
        c.setFillColorRGB(*fg)
        c.drawString(x0 + 10, y - 32, hx.upper())
        # Text
        c.setFont("WSb", 11)
        c.setFillColorRGB(*TEXT)
        c.drawString(x0 + 160, y - 14, name)
        c.setFont("JB", 8)
        c.setFillColorRGB(*MUTED)
        c.drawString(x0 + 160, y - 28, f"{rgb}   {cmyk}")
        c.setFont("WS", 9)
        c.setFillColorRGB(*MUTED)
        c.drawString(x0 + 160, y - 44, desc)

    draw_footer(c)
    c.showPage()


def page_typography(c):
    fill_bg(c)
    draw_header(c, 4, "TIPOGRAFÍA")

    c.setFont("ISb", 28)
    c.setFillColorRGB(*TEXT)
    c.drawString(40, PAGE_H - 80, "Tipografía")

    c.setFont("WS", 11)
    c.setFillColorRGB(*MUTED)
    c.drawString(40, PAGE_H - 100,
                 "Inter para la voz humana. JetBrains Mono para los datos.")

    # Inter block (usamos WorkSans como substituto con la misma geometría)
    c.setFillColorRGB(*BG_CARD)
    c.roundRect(40, PAGE_H - 380, PAGE_W - 80, 240, 12, fill=1, stroke=0)

    c.setFont("JB", 9)
    c.setFillColorRGB(*AMBER)
    c.drawString(60, PAGE_H - 165, "[ SANS / VOZ ]")
    c.setFont("WSb", 48)
    c.setFillColorRGB(*TEXT)
    c.drawString(60, PAGE_H - 220, "Inter")
    c.setFont("WS", 12)
    c.setFillColorRGB(*MUTED)
    c.drawString(60, PAGE_H - 240, "Aa Bb Cc Dd Ee Ff Gg  ·  0123456789")

    # Usage labels
    c.setFont("WSb", 10)
    c.setFillColorRGB(*TEXT)
    c.drawString(60, PAGE_H - 280, "Usos")
    c.setFont("WS", 9)
    c.setFillColorRGB(*MUTED)
    usos_inter = [
        "· Titulares, subtítulos, cuerpo de texto, CTA.",
        "· Bold 700 para headlines; Regular 400 para lectura.",
        "· Interletraje: -0.02em en titulares grandes.",
        "· Tamaños base: 14/16 px lectura; 32–56 px titulares.",
    ]
    y = PAGE_H - 296
    for u in usos_inter:
        c.drawString(70, y, u)
        y -= 13

    # Mono block
    c.setFillColorRGB(*BG_CARD)
    c.roundRect(40, PAGE_H - 620, PAGE_W - 80, 220, 12, fill=1, stroke=0)

    c.setFont("JB", 9)
    c.setFillColorRGB(*AMBER)
    c.drawString(60, PAGE_H - 405, "[ MONO / DATOS ]")
    c.setFont("JBb", 42)
    c.setFillColorRGB(*TEXT)
    c.drawString(60, PAGE_H - 455, "JetBrains Mono")
    c.setFont("JB", 12)
    c.setFillColorRGB(*MUTED)
    c.drawString(60, PAGE_H - 475, "BSL → JFK  ·  € 189  ·  2026-07-14")

    c.setFont("WSb", 10)
    c.setFillColorRGB(*TEXT)
    c.drawString(60, PAGE_H - 510, "Usos")
    c.setFont("WS", 9)
    c.setFillColorRGB(*MUTED)
    usos_mono = [
        "· IATAs, rutas, precios, fechas, códigos.",
        "· Metadata técnica y footers.",
        "· Nunca para párrafos largos ni CTAs principales.",
        "· Siempre con acento ámbar si es valor relevante.",
    ]
    y = PAGE_H - 526
    for u in usos_mono:
        c.drawString(70, y, u)
        y -= 13

    draw_footer(c)
    c.showPage()


def page_usage(c):
    fill_bg(c)
    draw_header(c, 5, "USOS CORRECTOS · INCORRECTOS")

    c.setFont("ISb", 28)
    c.setFillColorRGB(*TEXT)
    c.drawString(40, PAGE_H - 80, "Usos")

    c.setFont("WS", 11)
    c.setFillColorRGB(*MUTED)
    c.drawString(40, PAGE_H - 100,
                 "Reglas no negociables para mantener la marca coherente.")

    # Correct box
    c.setFillColorRGB(*BG_CARD)
    c.roundRect(40, PAGE_H - 360, (PAGE_W - 90) / 2, 230, 12, fill=1, stroke=0)
    c.setStrokeColorRGB(*SUCCESS)
    c.setLineWidth(1)
    c.roundRect(40, PAGE_H - 360, (PAGE_W - 90) / 2, 230, 12, fill=0, stroke=1)

    c.setFont("JBb", 11)
    c.setFillColorRGB(*SUCCESS)
    c.drawString(55, PAGE_H - 145, "SÍ")

    iso_path = os.path.join(OUT, "trip_cazador_iso_hibrido.png")
    c.drawImage(iso_path, 70, PAGE_H - 280, width=100, height=100, mask="auto")

    c.setFont("WS", 10)
    c.setFillColorRGB(*TEXT)
    oks = [
        "· Mantener proporciones originales.",
        "· Fondo oscuro #030712 o plano claro neutro.",
        "· Espacio mínimo = 1x la altura del isotipo.",
        "· Tamaño mínimo favicon 16×16 px.",
    ]
    y = PAGE_H - 300
    for o in oks:
        c.drawString(70, y, o)
        y -= 13

    # Wrong box
    x2 = 50 + (PAGE_W - 90) / 2
    c.setFillColorRGB(*BG_CARD)
    c.roundRect(x2, PAGE_H - 360, (PAGE_W - 90) / 2, 230, 12, fill=1, stroke=0)
    c.setStrokeColorRGB(*ERROR)
    c.setLineWidth(1)
    c.roundRect(x2, PAGE_H - 360, (PAGE_W - 90) / 2, 230, 12, fill=0, stroke=1)

    c.setFont("JBb", 11)
    c.setFillColorRGB(*ERROR)
    c.drawString(x2 + 15, PAGE_H - 145, "NO")

    # Wrong examples: stretched, recolored, with shadow
    # Stretched
    c.drawImage(iso_path, x2 + 15, PAGE_H - 280, width=140, height=80, mask="auto")
    c.setFont("JB", 7)
    c.setFillColorRGB(*ERROR)
    c.drawString(x2 + 15, PAGE_H - 290, "deformar")

    # Recolored (we draw a rect overlay to fake tinted version)
    c.setFillColorRGB(0.3, 0.6, 1.0)
    c.rect(x2 + 165, PAGE_H - 280, 80, 80, fill=1, stroke=0)
    c.setFont("JB", 7)
    c.setFillColorRGB(*ERROR)
    c.drawString(x2 + 165, PAGE_H - 290, "cambiar color")

    c.setFont("WS", 10)
    c.setFillColorRGB(*TEXT)
    bads = [
        "· No estirar, comprimir ni rotar.",
        "· No recolorear el isotipo.",
        "· No añadir sombras, glows ni contornos.",
        "· No girar el wordmark en vertical.",
    ]
    y = PAGE_H - 300
    for b in bads:
        c.drawString(x2 + 15, y, b)
        y -= 13

    # Clear space diagram
    c.setFont("WSb", 13)
    c.setFillColorRGB(*TEXT)
    c.drawString(40, PAGE_H - 400, "Espacio de respeto")
    c.setFont("WS", 10)
    c.setFillColorRGB(*MUTED)
    c.drawString(40, PAGE_H - 418,
                 "X = altura del isotipo. Mantén mínimo 1X libre en todos los lados.")

    # Diagram
    dx = 100
    dy = PAGE_H - 600
    iso_size = 100
    # dotted frame
    c.setStrokeColorRGB(*AMBER)
    c.setLineWidth(0.8)
    c.setDash(3, 3)
    c.rect(dx - iso_size, dy - iso_size, iso_size * 3, iso_size * 3, fill=0, stroke=1)
    c.setDash()
    c.drawImage(iso_path, dx, dy, width=iso_size, height=iso_size, mask="auto")
    # Label X
    c.setFont("JB", 9)
    c.setFillColorRGB(*AMBER)
    c.drawString(dx + iso_size + 20, dy + iso_size / 2, "1X")
    c.drawString(dx + iso_size / 2 - 5, dy - 20, "1X")

    draw_footer(c)
    c.showPage()


def page_voice(c):
    fill_bg(c)
    draw_header(c, 6, "VOZ · TONO")

    c.setFont("ISb", 28)
    c.setFillColorRGB(*TEXT)
    c.drawString(40, PAGE_H - 80, "Voz & tono")

    c.setFont("WS", 11)
    c.setFillColorRGB(*MUTED)
    c.drawString(40, PAGE_H - 100,
                 "Tech, pero cercano. Directo al grano. Útil. Con un guiño, nunca cursi.")

    # Principles
    principles = [
        ("DIRECTO", "Una frase dice qué hay. Nada de relleno."),
        ("PRECISO", "Precio, ruta, fechas. Si hay dato, se enseña."),
        ("CERCANO", "Hablamos de tú. Cero jerga de agencia."),
        ("HONESTO", "Si un chollo caduca, se dice. Sin humo."),
    ]
    for i, (name, desc) in enumerate(principles):
        x = 40 + (i % 2) * ((PAGE_W - 80) / 2 + 10)
        y = PAGE_H - 180 - (i // 2) * 80
        c.setFillColorRGB(*BG_CARD)
        c.roundRect(x, y - 60, (PAGE_W - 90) / 2, 60, 10, fill=1, stroke=0)
        c.setFillColorRGB(*AMBER)
        c.rect(x, y - 60, 4, 60, fill=1, stroke=0)
        c.setFont("JBb", 11)
        c.setFillColorRGB(*AMBER)
        c.drawString(x + 15, y - 20, name)
        c.setFont("WS", 10)
        c.setFillColorRGB(*TEXT)
        c.drawString(x + 15, y - 38, desc)

    # Good vs bad copy
    c.setFont("WSb", 13)
    c.setFillColorRGB(*TEXT)
    c.drawString(40, PAGE_H - 380, "Copy: así sí / así no")

    examples = [
        ("SI", "BSL → JFK Business por 412 €. Julio. Swiss. Aún 7 asientos.",
         "NO", "¡¡INCREÍBLE!! El mejor precio que has visto JAMÁS para volar a NUEVA YORK en súper-business ✈️✈️"),
        ("SI", "Error fare detectado. Suele durar <3h. Resérvalo ya.",
         "NO", "Maravillosa oportunidad única para los amantes de volar que no puede perderse nadie."),
        ("SI", "Llega un chollo cada 2–3 días. Sin spam, sin trampas.",
         "NO", "¡APÚNTATE AL CLUB VIP DE OFERTAS PREMIUM EXCLUSIVAS!"),
    ]

    y = PAGE_H - 420
    for (ok_lbl, ok_txt, bad_lbl, bad_txt) in examples:
        # OK
        c.setFillColorRGB(*BG_CARD)
        c.roundRect(40, y - 40, PAGE_W - 80, 40, 8, fill=1, stroke=0)
        c.setFillColorRGB(*SUCCESS)
        c.rect(40, y - 40, 4, 40, fill=1, stroke=0)
        c.setFont("JBb", 9)
        c.setFillColorRGB(*SUCCESS)
        c.drawString(55, y - 17, "SI")
        c.setFont("WS", 10)
        c.setFillColorRGB(*TEXT)
        c.drawString(80, y - 17, ok_txt)
        y -= 50

        # NO
        c.setFillColorRGB(*BG_CARD)
        c.roundRect(40, y - 40, PAGE_W - 80, 40, 8, fill=1, stroke=0)
        c.setFillColorRGB(*ERROR)
        c.rect(40, y - 40, 4, 40, fill=1, stroke=0)
        c.setFont("JBb", 9)
        c.setFillColorRGB(*ERROR)
        c.drawString(55, y - 17, "NO")
        c.setFont("WS", 10)
        c.setFillColorRGB(*MUTED)
        c.drawString(80, y - 17, bad_txt)
        y -= 60

    draw_footer(c)
    c.showPage()


def page_applications(c):
    fill_bg(c)
    draw_header(c, 7, "APLICACIONES")

    c.setFont("ISb", 28)
    c.setFillColorRGB(*TEXT)
    c.drawString(40, PAGE_H - 80, "Aplicaciones")

    c.setFont("WS", 11)
    c.setFillColorRGB(*MUTED)
    c.drawString(40, PAGE_H - 100,
                 "Cómo vive la marca en la web, el favicon y las redes.")

    # Row 1: landing mockup (fake browser)
    mk_x, mk_y = 40, PAGE_H - 380
    mk_w, mk_h = PAGE_W - 80, 250
    # browser chrome
    c.setFillColorRGB(*BG_CARD)
    c.roundRect(mk_x, mk_y, mk_w, mk_h, 10, fill=1, stroke=0)
    c.setFillColorRGB(0.12, 0.15, 0.20)
    c.rect(mk_x, mk_y + mk_h - 28, mk_w, 28, fill=1, stroke=0)
    for i, col in enumerate([(0.95, 0.35, 0.35), (0.98, 0.75, 0.18), (0.30, 0.80, 0.45)]):
        c.setFillColorRGB(*col)
        c.circle(mk_x + 14 + i * 14, mk_y + mk_h - 14, 4, fill=1, stroke=0)
    c.setFont("JB", 8)
    c.setFillColorRGB(*MUTED)
    c.drawString(mk_x + 70, mk_y + mk_h - 18, "tripcazador.com")

    # Inside landing: logo + hero + deal card
    logo_path = os.path.join(OUT, "trip_cazador_horizontal_hibrido.png")
    c.drawImage(logo_path, mk_x + 20, mk_y + mk_h - 80, width=180, height=48, mask="auto")

    c.setFont("WSb", 20)
    c.setFillColorRGB(*TEXT)
    c.drawString(mk_x + 20, mk_y + mk_h - 120, "Chollos de vuelo,")
    c.setFillColorRGB(*AMBER)
    c.drawString(mk_x + 20, mk_y + mk_h - 145, "detectados en segundos.")

    c.setFont("WS", 9)
    c.setFillColorRGB(*MUTED)
    c.drawString(mk_x + 20, mk_y + mk_h - 165,
                 "Business class a precio de economy. Error fares verificados. 24/7.")

    # Fake deal card
    dc_x = mk_x + 20
    dc_y = mk_y + 30
    dc_w = mk_w - 40
    c.setFillColorRGB(3 / 255, 7 / 255, 18 / 255)
    c.roundRect(dc_x, dc_y, dc_w, 70, 8, fill=1, stroke=0)
    c.setStrokeColorRGB(*AMBER)
    c.setLineWidth(1)
    c.roundRect(dc_x, dc_y, dc_w, 70, 8, fill=0, stroke=1)
    c.setFont("JBb", 14)
    c.setFillColorRGB(*TEXT)
    c.drawString(dc_x + 15, dc_y + 45, "BSL → JFK")
    c.setFont("JB", 9)
    c.setFillColorRGB(*MUTED)
    c.drawString(dc_x + 15, dc_y + 25, "Swiss · Business · 14–21 jul 2026")
    c.setFont("WSb", 22)
    c.setFillColorRGB(*AMBER)
    c.drawRightString(dc_x + dc_w - 15, dc_y + 42, "€ 412")

    # Row 2: favicon, telegram avatar, OG
    y2 = 120
    # Favicon
    fav_path = os.path.join(OUT, "favicon", "android-chrome-512x512.png")
    c.drawImage(fav_path, 40, y2, width=110, height=110, mask="auto")
    c.setFont("JB", 8)
    c.setFillColorRGB(*MUTED)
    c.drawString(40, y2 - 15, "Favicon / App icon")

    # Telegram avatar
    iso_hi_path = os.path.join(OUT, "trip_cazador_iso_hibrido_dark.png")
    c.drawImage(iso_hi_path, 170, y2, width=110, height=110, mask="auto")
    c.setFont("JB", 8)
    c.setFillColorRGB(*MUTED)
    c.drawString(170, y2 - 15, "Avatar Telegram")

    # Mini-OG thumbnail
    og_path = os.path.join(OUT, "og_default.png")
    c.drawImage(og_path, 300, y2, width=230, height=120, mask="auto")
    c.setFont("JB", 8)
    c.setFillColorRGB(*MUTED)
    c.drawString(300, y2 - 15, "OG image · 1200×630")

    draw_footer(c)
    c.showPage()


def page_closing(c):
    fill_bg(c)
    draw_header(c, 8, "CONTACTO")

    # Centered mark
    logo_path = os.path.join(OUT, "trip_cazador_iso_hibrido.png")
    c.drawImage(logo_path, (PAGE_W - 150) / 2, PAGE_H / 2 + 80, width=150, height=150, mask="auto")

    c.setFont("ISb", 32)
    c.setFillColorRGB(*TEXT)
    c.drawCentredString(PAGE_W / 2, PAGE_H / 2 + 30, "El cazador está despierto.")

    c.setFont("WS", 12)
    c.setFillColorRGB(*MUTED)
    c.drawCentredString(PAGE_W / 2, PAGE_H / 2 + 8,
                        "24/7. Detecta. Avisa. Tú reservas.")

    # Contact block
    c.setFont("JB", 10)
    c.setFillColorRGB(*AMBER)
    c.drawCentredString(PAGE_W / 2, PAGE_H / 2 - 40, "tripcazador.com")

    c.setFont("JB", 9)
    c.setFillColorRGB(*MUTED)
    c.drawCentredString(PAGE_W / 2, PAGE_H / 2 - 60, "hola@tripcazador.com")
    c.drawCentredString(PAGE_W / 2, PAGE_H / 2 - 76, "t.me/tripcazador")

    # Amber rule
    c.setFillColorRGB(*AMBER)
    c.rect(PAGE_W / 2 - 30, PAGE_H / 2 - 110, 60, 3, fill=1, stroke=0)

    # Footer colophon
    c.setFont("JB", 8)
    c.setFillColorRGB(*MUTED)
    c.drawCentredString(PAGE_W / 2, 60,
                        "Este documento es la v1.0 de la guía de marca. Evoluciona con el producto.")
    c.drawCentredString(PAGE_W / 2, 46,
                        "Typography: Inter · JetBrains Mono. Palette: amber-on-ink.")

    draw_footer(c)
    c.showPage()


def build():
    c = canvas.Canvas(PDF_PATH, pagesize=A4)
    c.setTitle("TripCazador Brand Guide v1.0")
    c.setAuthor("TripCazador")
    c.setSubject("Identidad visual, voz y aplicaciones")

    page_cover(c)
    page_logos(c)
    page_palette(c)
    page_typography(c)
    page_usage(c)
    page_voice(c)
    page_applications(c)
    page_closing(c)

    c.save()
    print(f"PDF saved → {PDF_PATH}")


if __name__ == "__main__":
    build()
