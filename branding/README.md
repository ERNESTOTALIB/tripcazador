# TripCazador — Branding

Identidad visual completa para **tripcazador.com**: el motor automático de
chollos de vuelo desde Europa.

> **Recomendación por defecto: concepto `hibrido`.**
> Es el más versátil (funciona en favicon 16 px, en cartel grande y en avatar
> de Telegram), comunica caza + tech sin literalidad, y se lee sin color.
> Úsalo como logo principal en la web y como base del favicon.

---

## 1. Estructura

```
branding/
├── TRIPCAZADOR_BRAND_GUIDE.pdf    ← 8 páginas, guía oficial
├── README.md                     ← este archivo
├── og_default.png                ← 1200×630, para compartir en social
│
├── trip_cazador_horizontal_tech.png           (1600×1024, transparente)
├── trip_cazador_horizontal_tech_dark.png      (1600×1024, sobre #030712)
├── trip_cazador_iso_tech.png                  (512×512, transparente)
├── trip_cazador_iso_tech_1024.png             (1024×1024, alta res)
├── trip_cazador_iso_tech_dark.png             (512×512, sobre #030712)
│
├── trip_cazador_horizontal_aventura(.png|_dark.png)
├── trip_cazador_iso_aventura(.png|_1024.png|_dark.png)
│
├── trip_cazador_horizontal_hibrido(.png|_dark.png)        ← DEFAULT
├── trip_cazador_iso_hibrido(.png|_1024.png|_dark.png)     ← DEFAULT
│
├── favicon/
│   ├── favicon.ico                  (multi-size 16·32·48)
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png         (180×180)
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   └── site.webmanifest              theme #f59e0b / bg #030712
│
├── social/
│   ├── telegram_post_template.png       (1280×720)
│   ├── instagram_post_template.png      (1080×1350)
│   └── instagram_story_template.png     (1080×1920)
│
├── _build_assets.py              (script de regeneración PNG)
└── _build_pdf.py                 (script de regeneración PDF)
```

Regenerar todo:

```bash
python3 _build_assets.py && python3 _build_pdf.py
```

---

## 2. Los tres conceptos

| Concepto       | Isotipo                         | Transmite                                        |
| -------------- | ------------------------------- | ------------------------------------------------ |
| **tech**       | Radar circular + corchetes + CV | Motor automático, terminal, data-first           |
| **aventura**   | Rapaz heráldica en ámbar        | Instinto, buen ojo, carácter                     |
| **hibrido** ★  | Diana concéntrica + ave angular | Caza con precisión. Tech + travel. **Por defecto** |

Los tres están en `transparente` (PNG con alpha) **y** sobre `_dark.png`
(fondo #030712) para revisión rápida de contraste.

---

## 3. Cómo usarlo en la web (Next.js / tripcazador-web)

### 3.1. Favicon

Copia **todo** el contenido de `branding/favicon/` a `tripcazador-web/public/`:

```bash
cp -r branding/favicon/* tripcazador-web/public/
```

En `app/layout.tsx` (Next 14 app router) añade los enlaces:

```tsx
export const metadata = {
  title: "TripCazador",
  description: "El cazador automático de chollos de vuelo desde Europa.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
  themeColor: "#f59e0b",
};
```

### 3.2. OG image por defecto

Copia `branding/og_default.png` a `tripcazador-web/public/og/default.png` y
referéncialo en `metadata`:

```tsx
openGraph: {
  images: [{ url: "/og/default.png", width: 1200, height: 630 }],
},
twitter: { card: "summary_large_image", images: ["/og/default.png"] },
```

### 3.3. Logo en header

Usa la versión horizontal con transparencia (la dark lleva fondo incrustado):

```tsx
import Image from "next/image";

<Image
  src="/brand/trip_cazador_horizontal_hibrido.png"
  alt="TripCazador"
  width={240}
  height={60}
  priority
/>
```

Para avatares cuadrados (Telegram, X/Twitter, footer) usa el iso:
`trip_cazador_iso_hibrido_1024.png`.

---

## 4. Plantillas sociales

Las tres plantillas en `social/` son **bases vacías** con zonas reservadas:

- Logo cabecera
- Etiqueta "CHOLLO DETECTADO"
- Bloque IATA origen → destino
- Precio en grande (ámbar)
- Meta (aerolínea, fechas, clase)
- URL / CTA

Abre el PNG en Figma / Photoshop / Canva y añade encima:

| Zona             | Texto recomendado                               |
| ---------------- | ----------------------------------------------- |
| Ruta             | `BSL → JFK` en JetBrains Mono Bold              |
| Precio           | `€ 189` en Inter (WorkSans) Bold, ámbar         |
| Meta             | `Swiss · Business · 14–21 jul 2026` en mono     |
| Precio tachado   | `normal €720` en muted, con tachón manual       |
| CTA / URL        | `tripcazador.com/deal/<slug>` en ámbar            |

Regla de oro: **no cambies el ámbar**, **no añadas más de un acento de color**.

---

## 5. Paleta (recordatorio)

| Rol       | HEX       | Uso                                       |
| --------- | --------- | ----------------------------------------- |
| Bg        | `#030712` | fondo principal                           |
| Bg Card   | `#0f172a` | tarjetas, contenedores                    |
| Primario  | `#f59e0b` | CTAs, precios, acentos                    |
| Hover     | `#fbbf24` | hover, highlights                         |
| Texto     | `#e5e7eb` | lectura                                   |
| Muted     | `#9ca3af` | secundario, labels                        |
| Éxito     | `#34d399` | deals verificados, OK                     |
| Error     | `#f87171` | caducado, stock agotado                   |

Tipografías: **Inter** (voz), **JetBrains Mono** (datos).

---

## 6. Brand Guide PDF

`TRIPCAZADOR_BRAND_GUIDE.pdf` (8 páginas, A4):

1. Portada
2. Conceptos de logo + criterios
3. Paleta de colores
4. Tipografía
5. Usos correctos / incorrectos + espacio de respeto
6. Voz y tono + copy sí/no
7. Aplicaciones (web, favicon, OG)
8. Contacto

Mándalo tal cual a cualquier diseñador o imprenta que trabaje la marca.

---

## 7. Licencia

Diseño original para **TripCazador** (tripcazador.com). Fuentes utilizadas bajo
SIL Open Font License 1.1 (Inter/WorkSans, JetBrains Mono, Instrument Sans).
