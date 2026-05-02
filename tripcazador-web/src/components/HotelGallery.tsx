"use client";

/**
 * HotelGallery — fase BBB2
 *
 * Galería de imágenes para detalle de hotel:
 *  - Imagen principal grande
 *  - 3 thumbnails clicables debajo
 *  - Lightbox modal con navegación teclado (←/→/Esc)
 *
 * Por qué SVG-friendly: las imágenes vienen de /api/img proxy (whitelisted
 * Unsplash) que cachea + sirve en formato óptimo para evitar layout shift.
 */
import { useState, useEffect, useCallback } from "react";

interface HotelGalleryProps {
  imageIds: string[];
  hotelName: string;
  city: string;
}

function imageUrl(id: string, w: number = 1280): string {
  const upstream = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=85`;
  return `/api/img?u=${encodeURIComponent(upstream)}&w=${w}&q=85`;
}

export function HotelGallery({ imageIds, hotelName, city }: HotelGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const next = useCallback(() => setActiveIdx((i) => (i + 1) % imageIds.length), [imageIds.length]);
  const prev = useCallback(() => setActiveIdx((i) => (i - 1 + imageIds.length) % imageIds.length), [imageIds.length]);

  // Keyboard navigation cuando lightbox está abierto
  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, next, prev]);

  if (imageIds.length === 0) return null;

  return (
    <div className="space-y-3" data-testid="hotel-gallery">
      {/* Hero principal + 3 thumbnails al lado en desktop */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3">
        {/* Hero */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="block aspect-[16/10] rounded-2xl overflow-hidden bg-gray-900 group relative"
          aria-label={`Abrir galería de fotos de ${hotelName}`}
          data-testid="hotel-gallery-hero"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl(imageIds[activeIdx], 1280)}
            alt={`${hotelName} en ${city} — foto ${activeIdx + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="eager"
          />
          <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full">
            📷 Ver todas las fotos ({imageIds.length})
          </span>
        </button>
        {/* Thumbnail grid */}
        <div className="hidden md:grid grid-cols-1 gap-3">
          {imageIds.slice(1, 4).map((id, i) => (
            <button
              key={id + i}
              type="button"
              onClick={() => { setActiveIdx(i + 1); setLightboxOpen(true); }}
              className="block aspect-[16/10] rounded-xl overflow-hidden bg-gray-900 group"
              aria-label={`Ver foto ${i + 2} de ${hotelName}`}
              data-testid={`hotel-gallery-thumb-${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl(id, 480)}
                alt={`${hotelName} — vista ${i + 2}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox modal */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Galería de ${hotelName}`}
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setLightboxOpen(false)}
          data-testid="hotel-gallery-lightbox"
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white text-3xl w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
            aria-label="Cerrar galería"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            data-testid="hotel-gallery-close"
          >
            ✕
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
            aria-label="Foto anterior"
            data-testid="hotel-gallery-prev"
          >
            ←
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
            aria-label="Foto siguiente"
            data-testid="hotel-gallery-next"
          >
            →
          </button>
          <div className="max-w-[90vw] max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl(imageIds[activeIdx], 1600)}
              alt={`${hotelName} — foto ${activeIdx + 1} de ${imageIds.length}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-1.5 rounded-full text-sm">
              {activeIdx + 1} / {imageIds.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
