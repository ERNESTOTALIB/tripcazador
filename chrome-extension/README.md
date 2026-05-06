# TripCazador Compare — Chrome Extension

Detecta cuando navegas Skyscanner / Google Flights / Kayak y muestra un badge flotante con la comparativa de precio de TripCazador.

## Instalar (developer mode)

1. Abrir `chrome://extensions/`
2. Activar "Modo desarrollador" (toggle arriba derecha)
3. "Cargar extensión sin empaquetar" → seleccionar esta carpeta `chrome-extension/`
4. Navegar a Skyscanner / Google Flights / Kayak — el badge aparece arriba a la derecha

## Publicar al Chrome Web Store

```bash
cd chrome-extension/
zip -r tripcazador-compare.zip . -x "*.md" "icons-source/*"
```

Subir `tripcazador-compare.zip` a https://chrome.google.com/webstore/devconsole/. Single-time fee $5.

Pendiente: iconos PNG en 16/32/48/128 (placeholders en `icons/`). Reemplazar con logo TripCazador.

## Permisos

Mínimos necesarios:
- `activeTab`: leer URL/DOM de la pestaña activa
- `storage`: cachear preferencias
- host_permissions: solo dominios de travel (Skyscanner/GF/Kayak) + tripcazador.com

No accede a otros sitios. No envía datos personales — solo (origen, destino, fecha) al endpoint público `tripcazador.com/api/deals`.

## Compatibilidad

- Manifest V3 (Chrome 88+, Edge, Brave, Opera, Vivaldi)
- Firefox: requiere conversión manifest V2 / nuevo manifest WebExtensions (TODO)
- Safari: NO compatible (Safari usa propio formato)
