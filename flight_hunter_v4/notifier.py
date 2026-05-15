"""
Flight Hunter V4 — Sistema de Notificaciones
=============================================
Canales disponibles:
1. Telegram Bot (recomendado) — alertas instantáneas en el móvil
2. Email (SMTP) — resumen por email
3. Archivo de log local (siempre activo)

Configuración Telegram:
1. Hablar con @BotFather en Telegram → /newbot → obtener token
2. Enviar cualquier mensaje al bot
3. Abrir: https://api.telegram.org/bot<TOKEN>/getUpdates
4. Copiar el chat_id de la respuesta
5. export TELEGRAM_BOT_TOKEN=...  y  export TELEGRAM_CHAT_ID=...
"""

import asyncio
import aiohttp
import json
import os
import hashlib
from datetime import datetime
from typing import List, Dict, Optional
import config


class TelegramNotifier:
    """Envía alertas de flight deals a un chat de Telegram."""

    API_URL = "https://api.telegram.org/bot{token}/{method}"
    MAX_MSG_LENGTH = 4096  # Límite de Telegram
    DEDUP_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".sent_alerts.json")

    def __init__(self, token: str = None, chat_id: str = None):
        self.token = token or config.TELEGRAM_BOT_TOKEN
        self.chat_id = chat_id or config.TELEGRAM_CHAT_ID
        self.available = bool(self.token and self.chat_id)
        self._sent_hashes = self._load_sent_hashes()

        if not self.token:
            print("⚠️  Telegram: TELEGRAM_BOT_TOKEN no configurado")
            print("   → Crear bot en: https://t.me/BotFather")
        elif not self.chat_id:
            print("⚠️  Telegram: TELEGRAM_CHAT_ID no configurado")
            print("   → Obtener chat_id: https://api.telegram.org/bot{token}/getUpdates")

    def _load_sent_hashes(self) -> set:
        """Carga hashes de alertas ya enviadas para evitar duplicados."""
        try:
            with open(self.DEDUP_FILE, "r") as f:
                data = json.load(f)
                return set(data.get("hashes", []))
        except Exception:
            return set()

    def _save_sent_hashes(self):
        """Guarda hashes en disco (máximo 1000 para evitar crecer indefinidamente)."""
        hashes = list(self._sent_hashes)[-1000:]
        try:
            with open(self.DEDUP_FILE, "w") as f:
                json.dump({"hashes": hashes}, f)
        except Exception as exc:  # noqa: BLE001
            # SSS203 (15 may 2026): antes silent — si disco lleno o permisos,
            # dedup file no se guardaba → alertas Telegram duplicadas
            # constantemente sin diagnóstico. Ahora log explícito.
            print(
                f"   ⚠️  Notifier _save_sent_hashes failed (alertas pueden duplicarse): "
                f"{type(exc).__name__}: {exc}",
                flush=True,
            )

    def _deal_hash(self, deal: Dict) -> str:
        """Hash único para un deal (evita alertas duplicadas)."""
        key = f"{deal.get('origin')}{deal.get('destination')}{deal.get('airline')}{deal.get('cabin_code')}{deal.get('price_eur')}"
        return hashlib.md5(key.encode()).hexdigest()[:12]

    def _format_deal_message(self, deal: Dict) -> str:
        """Formatea un deal para Telegram (Markdown V2)."""
        cls = deal.get("classification", "OFERTA")
        icon = {"CRÍTICO": "🚨", "ERROR": "❌", "ANOMALÍA": "⚠️", "OFERTA": "💰"}.get(cls, "✈️")
        price = deal.get("price_eur", 0)
        origin = deal.get("origin", "?")
        dest = deal.get("destination", "?")
        city = deal.get("city_to", dest)
        country = deal.get("country_to", "")
        airline = deal.get("airline", "?")
        cabin = deal.get("cabin", "Economy")
        date_out = deal.get("date_out", "?")
        date_ret = deal.get("date_ret", "")
        stops = deal.get("stops", 0)
        score = deal.get("final_score", 0)
        savings_eur = deal.get("savings_eur", 0)
        savings_pct = deal.get("savings_pct", 0)
        booking = deal.get("booking_url", "")
        ratio = deal.get("t4_ratio")
        eco_price = deal.get("t4_eco_price")
        reasons = deal.get("reasons", [])
        main_reason = deal.get("main_reason", "Precio inusualmente bajo")

        location = f"{city}, {country}" if country else city

        msg_parts = [
            f"{icon} *{cls}* — Score: {score:.0f}/100",
            f"",
            f"✈️ *{origin} → {location}* \\({dest}\\)",
            f"💺 Cabina: {cabin} | Aerolínea: {airline}",
            f"💰 Precio: *{price:.0f}€*",
        ]

        if savings_eur > 0:
            msg_parts.append(f"💵 Ahorro estimado: \\-{savings_eur:.0f}€ \\({savings_pct:.0f}% descuento\\)")

        if ratio and eco_price:
            msg_parts.append(f"📊 Ratio B/E: *{ratio:.1f}x* \\(Economy: {eco_price:.0f}€\\)")

        msg_parts += [
            f"📅 {date_out} → {date_ret or '?'}",
            f"🔄 {'Vuelo directo' if stops == 0 else f'{stops} escala(s)'}",
            f"",
            f"📌 _{self._escape_md(main_reason)}_",
        ]

        if booking:
            msg_parts.append(f"")
            msg_parts.append(f"[🔖 RESERVAR AHORA]({booking})")

        return "\n".join(msg_parts)

    @staticmethod
    def _escape_md(text: str) -> str:
        """Escapa caracteres especiales de MarkdownV2."""
        if not text:
            return ""
        chars = r'_*[]()~`>#+-=|{}.!'
        for c in chars:
            text = text.replace(c, f"\\{c}")
        return text

    async def send_deal_alert(self, deal: Dict, session: aiohttp.ClientSession) -> bool:
        """Envía alerta de un deal. Retorna True si fue enviado."""
        if not self.available:
            return False

        # Deduplicación
        h = self._deal_hash(deal)
        if h in self._sent_hashes:
            return False

        msg = self._format_deal_message(deal)
        success = await self._send_message(msg, session, parse_mode="MarkdownV2")

        if success:
            self._sent_hashes.add(h)
            self._save_sent_hashes()

        return success

    async def send_summary(
        self, analyzed: List[Dict], search_params: Dict, session: aiohttp.ClientSession
    ) -> bool:
        """Envía un resumen de la búsqueda."""
        if not self.available:
            return False

        now = datetime.now().strftime("%Y-%m-%d %H:%M")
        mode = search_params.get("mode", "?")
        criticos = sum(1 for a in analyzed if a.get("classification") == "CRÍTICO")
        errores = sum(1 for a in analyzed if a.get("classification") == "ERROR")
        anomalias = sum(1 for a in analyzed if a.get("classification") == "ANOMALÍA")
        total = len(analyzed)

        origins = search_params.get("origins", [])
        origins_str = self._escape_md(", ".join(origins[:5]) + ("..." if len(origins) > 5 else ""))
        date_from = self._escape_md(search_params.get("date_from", ""))
        date_to = self._escape_md(search_params.get("date_to", ""))

        msg = (
            f"✈️ *Flight Hunter V4 — Resultados*\n"
            f"_{now}_\n\n"
            f"🔍 Modo: {self._escape_md(mode)}\n"
            f"🛫 Desde: {origins_str}\n"
            f"📅 Rango: {date_from} → {date_to}\n\n"
            f"🚨 Críticos: *{criticos}*\n"
            f"❌ Errores: *{errores}*\n"
            f"⚠️ Anomalías: *{anomalias}*\n"
            f"📊 Total: {total} deals\n\n"
            f"_Revisa el dashboard HTML para ver todos los detalles_"
        )

        return await self._send_message(msg, session, parse_mode="MarkdownV2")

    async def _send_message(
        self, text: str, session: aiohttp.ClientSession, parse_mode: str = "MarkdownV2"
    ) -> bool:
        """Envía un mensaje a Telegram."""
        url = self.API_URL.format(token=self.token, method="sendMessage")

        # Truncar si es muy largo
        if len(text) > self.MAX_MSG_LENGTH:
            text = text[:self.MAX_MSG_LENGTH - 10] + "\n\\.\\.\\."

        payload = {
            "chat_id": self.chat_id,
            "text": text,
            "parse_mode": parse_mode,
            "disable_web_page_preview": True,
        }

        try:
            async with session.post(url, json=payload) as resp:
                if resp.status == 200:
                    return True
                elif resp.status == 429:
                    await asyncio.sleep(5)
                    async with session.post(url, json=payload) as resp2:
                        return resp2.status == 200
                else:
                    error = await resp.text()
                    # Si hay error de MarkdownV2, intentar sin formato
                    if "parse" in error.lower():
                        payload["parse_mode"] = ""
                        # Limpiar escape chars
                        payload["text"] = text.replace("\\", "")
                        async with session.post(url, json=payload) as resp3:
                            return resp3.status == 200
                    return False
        except Exception as e:
            print(f"   ⚠️ Error Telegram: {e}")
            return False

    async def notify_deals(
        self,
        analyzed: List[Dict],
        search_params: Dict,
        only_classes: List[str] = None,
        max_alerts: int = 10,
    ) -> int:
        """
        Envía alertas para todos los deals relevantes.

        Args:
            analyzed: Lista de deals del detector
            search_params: Parámetros de búsqueda
            only_classes: Solo alertar estas clasificaciones (default: CRÍTICO + ERROR)
            max_alerts: Máximo de alertas individuales a enviar

        Returns:
            Número de mensajes enviados
        """
        if not self.available:
            print("   ⚠️ Telegram no configurado — sin notificaciones")
            return 0

        if only_classes is None:
            only_classes = ["CRÍTICO", "ERROR"]

        to_notify = [a for a in analyzed if a.get("classification") in only_classes]
        sent = 0

        timeout = aiohttp.ClientTimeout(total=30)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            # Resumen primero
            await self.send_summary(analyzed, search_params, session)
            await asyncio.sleep(1)

            # Alertas individuales
            for deal in to_notify[:max_alerts]:
                success = await self.send_deal_alert(deal, session)
                if success:
                    sent += 1
                    print(f"   📱 Telegram: {deal['origin']}→{deal['destination']} {deal['price_eur']:.0f}€ enviado")
                    await asyncio.sleep(0.5)  # Rate limit Telegram: 30 msg/s

        print(f"   📱 Telegram: {sent} alertas enviadas")
        return sent


class FileNotifier:
    """Guarda log de todos los deals encontrados en archivo local."""

    def __init__(self, log_path: str = None):
        self.log_path = log_path or os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "deals_log.jsonl"
        )

    def log_deals(self, analyzed: List[Dict], search_params: Dict):
        """Añade deals al log en formato JSONL (una línea por deal)."""
        now = datetime.now().isoformat()
        with open(self.log_path, "a", encoding="utf-8") as f:
            for deal in analyzed:
                record = {
                    "logged_at": now,
                    "search_mode": search_params.get("mode", ""),
                    **{k: v for k, v in deal.items() if k not in ("reasons",)},
                }
                f.write(json.dumps(record, ensure_ascii=False, default=str) + "\n")

        print(f"   📝 Log: {len(analyzed)} deals guardados en {self.log_path}")


class NotificationManager:
    """Gestiona todos los canales de notificación."""

    def __init__(self):
        self.telegram = TelegramNotifier()
        self.file_logger = FileNotifier()

    async def notify_all(
        self,
        analyzed: List[Dict],
        search_params: Dict,
        telegram_classes: List[str] = None,
        max_telegram_alerts: int = 10,
    ) -> Dict:
        """
        Envía notificaciones por todos los canales configurados.

        Returns:
            Dict con estadísticas de envío
        """
        stats = {"telegram": 0, "logged": 0}

        # Siempre log en archivo
        self.file_logger.log_deals(analyzed, search_params)
        stats["logged"] = len(analyzed)

        # Telegram si está configurado
        if self.telegram.available:
            stats["telegram"] = await self.telegram.notify_deals(
                analyzed, search_params,
                only_classes=telegram_classes or ["CRÍTICO", "ERROR"],
                max_alerts=max_telegram_alerts,
            )
        else:
            print("   💡 Para activar alertas Telegram:")
            print("      export TELEGRAM_BOT_TOKEN=tu_token")
            print("      export TELEGRAM_CHAT_ID=tu_chat_id")
            print("      Guía: https://t.me/BotFather → /newbot")

        return stats
