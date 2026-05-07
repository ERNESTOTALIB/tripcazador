# Telegram sticker pack — TripCazador

> SSS83 May 2026 — viral branding via stickers que la gente comparte en chats.

## Concepto

8 stickers temáticos del cazador de chollos:

| # | Concepto | Texto/emoji | Uso |
|---|---|---|---|
| 1 | 🔥 Logo + "CHOLLO" | "¡CHOLLO!" amarillo | Reaccionar a deals |
| 2 | 😱 Cazador shocked | "ERROR FARE" navy | Cuando ven precio bajo |
| 3 | ✈️ Avión + €€€ | "¡A CAZAR!" | Compartir motivacional |
| 4 | 🎯 Diana + maleta | "DIANA" | Conseguí el chollo |
| 5 | 💸 Billetes volando | "AHORRO TOTAL" | Presumir ahorro |
| 6 | 🏖️ Hamaca + €99 | "¡DE VIAJE!" | Reservé |
| 7 | 😴 Cama + alarma | "ME VOY EL FINDE" | Espontáneo |
| 8 | 🤝 Apretón manos | "GRACIAS TC" | Compartir gratitud |

## Generación rápida (PIL)

Los stickers son PNG 512×512 (Telegram standard). Yo los puedo generar con
PIL+landmarks reusando paleta TripCazador (navy `#0F172A` + amber `#FBBF24`).

```bash
python scripts/generate_telegram_stickers.py
# Genera 8 PNG en branding/stickers/*.png
```

## Subir el pack

1. Telegram → buscar `@Stickers` (sticker bot oficial)
2. Comando: `/newpack`
3. Nombre del pack: **TripCazador Cazadores**
4. Por cada sticker:
   - Manda PNG al bot
   - Asocia 1-2 emojis (👇 sugerencia)
     - 1→🔥 2→😱 3→✈️ 4→🎯 5→💸 6→🏖️ 7→😴 8→🤝
5. Comando final: `/publish`
6. Short name: `tripcazador` (será `t.me/addstickers/tripcazador`)
7. Bot devuelve URL pública

## Promoción

- En `/blog/post-bienvenida` añade banner "👉 Pack stickers TripCazador para WhatsApp/Telegram"
- En el bot Telegram al `/start` mandar el sticker #1 + link al pack
- En Instagram bio: emoji + link al pack

## Métricas

Los stickers no tienen analytics nativos. Aproximación:
- Cuenta clicks al short link `t.me/addstickers/tripcazador` desde Bing Webmaster
- Mide menciones del hashtag `#tripcazadorstickers`

## Estado actual TripCazador

- [ ] Generar 8 PNG con PIL (script pendiente: `generate_telegram_stickers.py`)
- [ ] Subir pack a @Stickers
- [ ] Anunciar en Telegram channel + Instagram + blog
