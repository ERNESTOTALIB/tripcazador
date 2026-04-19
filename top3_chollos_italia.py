"""Generate PDF report for top 3 hotel deals in Italy"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

OUTPUT = "/sessions/ecstatic-nifty-planck/mnt/Viajes/TOP3_CHOLLOS_ITALIA.pdf"

# Colors
DARK_BLUE = HexColor("#1a365d")
ACCENT_BLUE = HexColor("#2b6cb0")
LIGHT_BLUE = HexColor("#ebf4ff")
GOLD = HexColor("#d69e2e")
GREEN = HexColor("#276749")
LIGHT_GREEN = HexColor("#f0fff4")
RED = HexColor("#c53030")
LIGHT_RED = HexColor("#fff5f5")
GRAY = HexColor("#718096")
LIGHT_GRAY = HexColor("#f7fafc")

hotels = [
    {
        "rank": 1,
        "name": "Hotel Gaston",
        "location": "Rimini, Italia",
        "stars": 4,
        "score": 8.0,
        "ppn": "96\u20ac",
        "total": "674\u20ac",
        "nights": 7,
        "dates": "15 jul - 22 jul 2026",
        "savings": "54% menos que la mediana",
        "median": "1.452\u20ac",
        "filters": "4\u2605 \u2022 Playa \u2022 Piscina",
        "url": "booking.com/hotel/it/gaston",
        "highlight": "Mejor VALUE_SCORE del ranking. Rimini, playa + piscina a precio de 3 estrellas.",
        "color": GOLD,
        "bg": HexColor("#fffff0"),
    },
    {
        "rank": 2,
        "name": "Sunshine Club Hotel Centro Benessere",
        "location": "Tropea, Calabria, Italia",
        "stars": 4,
        "score": 8.0,
        "ppn": "95\u20ac",
        "total": "665\u20ac",
        "nights": 7,
        "dates": "29 jul - 5 ago 2026",
        "savings": "62% menos que la mediana",
        "median": "1.729\u20ac",
        "filters": "4\u2605 \u2022 Playa \u2022 Piscina \u2022 Wellness",
        "url": "booking.com/hotel/it/sunshine-club-centro-benessere",
        "highlight": "El mayor descuento detectado. Tropea es una de las playas mas bonitas de Italia.",
        "color": RED,
        "bg": LIGHT_RED,
    },
    {
        "rank": 3,
        "name": "Main Palace Hotel",
        "location": "Taormina, Sicilia, Italia",
        "stars": 4,
        "score": 7.9,
        "ppn": "109\u20ac",
        "total": "762\u20ac",
        "nights": 7,
        "dates": "15 jul - 22 jul 2026",
        "savings": "59% menos que la mediana",
        "median": "1.862\u20ac",
        "filters": "4\u2605 \u2022 Playa \u2022 Piscina",
        "url": "booking.com/hotel/it/main-palace",
        "highlight": "Taormina con vistas al Etna. Precio imposible para temporada alta en Sicilia.",
        "color": ACCENT_BLUE,
        "bg": LIGHT_BLUE,
    },
]

def build_pdf():
    c = canvas.Canvas(OUTPUT, pagesize=A4)
    w, h = A4

    # === HEADER ===
    c.setFillColor(DARK_BLUE)
    c.rect(0, h - 3.5*cm, w, 3.5*cm, fill=1, stroke=0)

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(2*cm, h - 1.8*cm, "TOP 3 CHOLLOS ITALIA")

    c.setFont("Helvetica", 11)
    c.drawString(2*cm, h - 2.6*cm, "Hotel Deal Hunter v4  |  Julio-Agosto 2026  |  4\u2605 Playa + Piscina")

    c.setFont("Helvetica", 9)
    c.setFillColor(HexColor("#a0aec0"))
    c.drawString(2*cm, h - 3.2*cm, "426 hoteles analizados  \u2022  20 destinos  \u2022  8 paginas/destino  \u2022  3 semanas comparadas")

    # === STATS BAR ===
    y_stats = h - 4.8*cm
    c.setFillColor(LIGHT_GRAY)
    c.roundRect(1.5*cm, y_stats - 0.4*cm, w - 3*cm, 1.5*cm, 4, fill=1, stroke=0)

    stats = [
        ("15", "Errores"),
        ("2", "Anomalias"),
        ("60", "Chollos"),
        ("426", "Hoteles"),
    ]
    stat_x = 3*cm
    for val, label in stats:
        c.setFillColor(DARK_BLUE)
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(stat_x, y_stats + 0.4*cm, val)
        c.setFillColor(GRAY)
        c.setFont("Helvetica", 8)
        c.drawCentredString(stat_x, y_stats - 0.05*cm, label)
        stat_x += 4.5*cm

    # === HOTEL CARDS ===
    y = h - 6.5*cm

    for hotel in hotels:
        card_h = 6.8*cm

        # Card background
        c.setFillColor(hotel["bg"])
        c.setStrokeColor(hotel["color"])
        c.setLineWidth(1.5)
        c.roundRect(1.5*cm, y - card_h, w - 3*cm, card_h, 6, fill=1, stroke=1)

        # Rank badge
        badge_x = 2.2*cm
        badge_y = y - 1*cm
        c.setFillColor(hotel["color"])
        c.circle(badge_x, badge_y, 0.55*cm, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(badge_x, badge_y - 0.2*cm, f"#{hotel['rank']}")

        # Hotel name
        c.setFillColor(DARK_BLUE)
        c.setFont("Helvetica-Bold", 15)
        c.drawString(3.5*cm, y - 0.9*cm, hotel["name"])

        # Location + stars
        c.setFont("Helvetica", 10)
        c.setFillColor(GRAY)
        stars_str = "\u2605" * hotel["stars"]
        c.drawString(3.5*cm, y - 1.5*cm, f"{hotel['location']}  |  {stars_str}  |  Nota: {hotel['score']}/10")

        # Price box
        price_box_x = w - 5.5*cm
        c.setFillColor(GREEN)
        c.roundRect(price_box_x, y - 2.2*cm, 4*cm, 1.8*cm, 4, fill=1, stroke=0)

        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 22)
        c.drawCentredString(price_box_x + 2*cm, y - 1.2*cm, hotel["ppn"])
        c.setFont("Helvetica", 9)
        c.drawCentredString(price_box_x + 2*cm, y - 1.7*cm, "por noche")
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(price_box_x + 2*cm, y - 2.05*cm, f"Total: {hotel['total']} / {hotel['nights']}n")

        # Details
        detail_y = y - 2.5*cm
        c.setFont("Helvetica", 9)
        c.setFillColor(DARK_BLUE)

        details = [
            f"Fechas: {hotel['dates']}",
            f"Filtros: {hotel['filters']}",
            f"Descuento: {hotel['savings']} (mediana: {hotel['median']})",
        ]
        for line in details:
            c.drawString(2.3*cm, detail_y, line)
            detail_y -= 0.45*cm

        # Highlight
        c.setFont("Helvetica-BoldOblique", 9)
        c.setFillColor(hotel["color"])
        c.drawString(2.3*cm, detail_y - 0.1*cm, hotel["highlight"])

        # URL
        c.setFont("Helvetica", 8)
        c.setFillColor(ACCENT_BLUE)
        c.drawString(2.3*cm, detail_y - 0.6*cm, hotel["url"])

        y -= card_h + 0.5*cm

    # === FOOTER ===
    c.setFillColor(DARK_BLUE)
    c.rect(0, 0, w, 1.5*cm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica", 8)
    c.drawCentredString(w/2, 0.7*cm, "Hotel Deal Hunter v4  |  Motor de deteccion de errores de precio en Booking.com")
    c.setFont("Helvetica", 7)
    c.setFillColor(HexColor("#a0aec0"))
    c.drawCentredString(w/2, 0.3*cm, "Para encontrar errores tipo 30eur/noche: ejecutar como tarea programada cada pocas horas")

    c.save()
    print(f"PDF saved: {OUTPUT}")

build_pdf()
