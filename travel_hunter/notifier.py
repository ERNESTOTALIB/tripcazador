"""
Travel Hunter - Notifier Module
Envía notificaciones por email cuando detecta ofertas, bajadas o errores de precio.
Envía reportes separados para vuelos y hoteles.
"""

import smtplib
import json
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import List, Dict, Optional


class EmailNotifier:
    """Envía notificaciones de precios por email."""

    def __init__(
        self,
        smtp_server: str = "smtp.gmail.com",
        smtp_port: int = 587,
        sender_email: str = "",
        sender_password: str = "",  # App password para Gmail
        recipient_email: str = "",
    ):
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.sender_email = sender_email
        self.sender_password = sender_password
        self.recipient_email = recipient_email

    def _send_email(self, subject: str, html_body: str, text_body: str = ""):
        """Envía un email."""
        if not all([self.sender_email, self.sender_password, self.recipient_email]):
            print(f"⚠️  Email no configurado. Asunto: {subject}")
            print(f"   Configura SMTP en config.json para recibir notificaciones.")
            return False

        msg = MIMEMultipart("alternative")
        msg["From"] = self.sender_email
        msg["To"] = self.recipient_email
        msg["Subject"] = subject

        if text_body:
            msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)
            print(f"✅ Email enviado: {subject}")
            return True
        except Exception as e:
            print(f"❌ Error enviando email: {e}")
            return False

    # =========================================================================
    # TEMPLATES HTML
    # =========================================================================

    def _flight_alert_html(self, alerts: List[dict], search_params: dict = None) -> str:
        """Genera HTML para alerta de vuelos."""
        now = datetime.now().strftime("%d/%m/%Y %H:%M")

        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white;
                             border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(135deg, #667eea, #764ba2);
                          padding: 20px; color: white; text-align: center; }}
                .header h1 {{ margin: 0; font-size: 24px; }}
                .content {{ padding: 20px; }}
                .alert-card {{ background: #f8f9fa; border-left: 4px solid #28a745;
                              padding: 15px; margin: 10px 0; border-radius: 5px; }}
                .price-error {{ border-left-color: #dc3545; background: #fff3f3; }}
                .price {{ font-size: 28px; font-weight: bold; color: #28a745; }}
                .old-price {{ text-decoration: line-through; color: #999; font-size: 18px; }}
                .savings {{ background: #28a745; color: white; padding: 3px 8px;
                           border-radius: 3px; font-size: 14px; display: inline-block; }}
                .route {{ font-size: 18px; font-weight: bold; color: #333; }}
                .details {{ color: #666; font-size: 14px; margin-top: 5px; }}
                .cta {{ display: inline-block; background: #667eea; color: white;
                       padding: 10px 20px; text-decoration: none; border-radius: 5px;
                       margin-top: 10px; }}
                .footer {{ padding: 15px; text-align: center; color: #999; font-size: 12px;
                          border-top: 1px solid #eee; }}
                .urgent {{ background: #dc3545; color: white; padding: 5px 10px;
                          border-radius: 3px; font-size: 12px; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✈️ Travel Hunter - Vuelos</h1>
                    <p>{now}</p>
                </div>
                <div class="content">
        """

        for alert in alerts:
            is_error = alert.get("type") == "price_error"
            card_class = "alert-card price-error" if is_error else "alert-card"

            html += f"""
                <div class="{card_class}">
                    {"<span class='urgent'>⚡ ERROR DE PRECIO</span>" if is_error else ""}
                    <div class="route">{alert.get('route', 'N/A')}</div>
                    <div class="details">
                        {alert.get('airline', '')} · {alert.get('platform', '')}
                        {' · ' + alert.get('dates', '') if alert.get('dates') else ''}
                    </div>
                    <div style="margin-top: 10px;">
            """

            if alert.get("type") == "price_drop":
                html += f"""
                        <span class="old-price">{alert['old_price']}€</span>
                        <span class="price">{alert['new_price']}€</span>
                        <span class="savings">-{alert['drop_percent']}%</span>
                        <div class="details">Precio medio: {alert.get('avg_price', 'N/A')}€</div>
                """
            elif alert.get("type") == "price_error":
                html += f"""
                        <div>Agregadores: <span class="old-price">{alert['aggregator_price']}€</span></div>
                        <div>Precio directo: <span class="price">{alert['direct_price']}€</span></div>
                        <span class="savings">Ahorras {alert['savings']}€ ({alert['difference_percent']}%)</span>
                        <div class="details" style="color: #dc3545; font-weight: bold;">
                            ⚠️ Los errores de precio se corrigen rápido. ¡Actúa ya!
                        </div>
                """
            elif alert.get("type") == "aggregator_deal":
                html += f"""
                        <div>Web directa: <span class="old-price">{alert['direct_price']}€</span></div>
                        <div>{alert.get('aggregator_platform', '')}: <span class="price">{alert['aggregator_price']}€</span></div>
                        <span class="savings">Ahorras {alert['savings']}€</span>
                """

            url = alert.get("direct_url") or alert.get("aggregator_url") or alert.get("url", "#")
            html += f"""
                    </div>
                    <a href="{url}" class="cta">Ver oferta →</a>
                </div>
            """

        html += """
                </div>
                <div class="footer">
                    Travel Hunter · Búsqueda automática de ofertas de viaje
                </div>
            </div>
        </body>
        </html>
        """
        return html

    def _hotel_alert_html(self, alerts: List[dict], search_params: dict = None) -> str:
        """Genera HTML para alerta de hoteles."""
        now = datetime.now().strftime("%d/%m/%Y %H:%M")

        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white;
                             border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(135deg, #f093fb, #f5576c);
                          padding: 20px; color: white; text-align: center; }}
                .header h1 {{ margin: 0; font-size: 24px; }}
                .content {{ padding: 20px; }}
                .hotel-card {{ background: #f8f9fa; border-left: 4px solid #fd7e14;
                              padding: 15px; margin: 10px 0; border-radius: 5px; }}
                .price {{ font-size: 28px; font-weight: bold; color: #fd7e14; }}
                .old-price {{ text-decoration: line-through; color: #999; font-size: 18px; }}
                .savings {{ background: #fd7e14; color: white; padding: 3px 8px;
                           border-radius: 3px; font-size: 14px; display: inline-block; }}
                .hotel-name {{ font-size: 18px; font-weight: bold; color: #333; }}
                .rating {{ color: #ffc107; font-weight: bold; }}
                .details {{ color: #666; font-size: 14px; margin-top: 5px; }}
                .cta {{ display: inline-block; background: #fd7e14; color: white;
                       padding: 10px 20px; text-decoration: none; border-radius: 5px;
                       margin-top: 10px; }}
                .footer {{ padding: 15px; text-align: center; color: #999; font-size: 12px;
                          border-top: 1px solid #eee; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏨 Travel Hunter - Hoteles</h1>
                    <p>{now}</p>
                </div>
                <div class="content">
        """

        for alert in alerts:
            html += f"""
                <div class="hotel-card">
                    <div class="hotel-name">{alert.get('name', 'Hotel')}</div>
                    <div class="details">
                        {alert.get('platform', '')} · {alert.get('dates', '')}
                    </div>
                    <div style="margin-top: 10px;">
                        <span class="old-price">{alert.get('old_price', 'N/A')}€</span>
                        <span class="price">{alert.get('new_price', 'N/A')}€</span>
                        <span class="savings">-{alert.get('drop_percent', 0)}%</span>
                        <div class="details">Precio medio: {alert.get('avg_price', 'N/A')}€</div>
                    </div>
                    <a href="{alert.get('url', '#')}" class="cta">Ver hotel →</a>
                </div>
            """

        html += """
                </div>
                <div class="footer">
                    Travel Hunter · Búsqueda automática de ofertas de viaje
                </div>
            </div>
        </body>
        </html>
        """
        return html

    def _summary_html(
        self,
        flight_results: list,
        hotel_results: list,
        urls: dict,
        search_params: dict,
    ) -> str:
        """Genera HTML de resumen de búsqueda."""
        now = datetime.now().strftime("%d/%m/%Y %H:%M")

        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white;
                             border-radius: 10px; overflow: hidden; }}
                .header {{ background: linear-gradient(135deg, #00b4db, #0083b0);
                          padding: 20px; color: white; text-align: center; }}
                .content {{ padding: 20px; }}
                .section {{ margin: 15px 0; }}
                .section h2 {{ color: #333; border-bottom: 2px solid #00b4db; padding-bottom: 5px; }}
                table {{ width: 100%; border-collapse: collapse; }}
                th, td {{ padding: 8px; text-align: left; border-bottom: 1px solid #eee; }}
                th {{ background: #f8f9fa; color: #333; }}
                .best {{ background: #e8f5e9; font-weight: bold; }}
                .url-list a {{ display: block; color: #0083b0; margin: 5px 0; }}
                .footer {{ padding: 15px; text-align: center; color: #999; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 Resumen de Búsqueda</h1>
                    <p>{now}</p>
                </div>
                <div class="content">
        """

        # Sección vuelos
        if flight_results:
            html += """<div class="section"><h2>✈️ Mejores Vuelos</h2><table>
                <tr><th>Aerolínea</th><th>Plataforma</th><th>Precio</th><th>Escalas</th></tr>"""
            for i, f in enumerate(flight_results[:10]):
                row_class = 'class="best"' if i == 0 else ""
                html += f"""<tr {row_class}>
                    <td>{f.airline}</td><td>{f.platform}</td>
                    <td>{f.price}€</td><td>{f.stops}</td></tr>"""
            html += "</table></div>"
        else:
            html += '<div class="section"><h2>✈️ Vuelos</h2><p>No se pudieron extraer precios automáticamente. Usa los enlaces de abajo.</p></div>'

        # Sección hoteles
        if hotel_results:
            html += """<div class="section"><h2>🏨 Mejores Hoteles</h2><table>
                <tr><th>Hotel</th><th>Plataforma</th><th>Total</th><th>Rating</th></tr>"""
            for i, h in enumerate(hotel_results[:10]):
                row_class = 'class="best"' if i == 0 else ""
                html += f"""<tr {row_class}>
                    <td>{h.name[:30]}</td><td>{h.platform}</td>
                    <td>{h.price_total}€</td><td>{h.rating}</td></tr>"""
            html += "</table></div>"
        else:
            html += '<div class="section"><h2>🏨 Hoteles</h2><p>No se pudieron extraer precios automáticamente. Usa los enlaces de abajo.</p></div>'

        # URLs de fallback
        html += '<div class="section"><h2>🔗 Enlaces Directos</h2><div class="url-list">'
        for name, url in urls.items():
            display_name = name.replace("_", " ").replace("flight ", "✈️ ").replace("hotel ", "🏨 ").title()
            html += f'<a href="{url}">{display_name}</a>'
        html += "</div></div>"

        html += """
                </div>
                <div class="footer">
                    Travel Hunter · Próxima búsqueda automática según configuración
                </div>
            </div>
        </body>
        </html>
        """
        return html

    def _anomaly_alert_html(self, anomalies: List[dict]) -> str:
        """Genera HTML para alertas de anomalías de hotel."""
        now = datetime.now().strftime("%d/%m/%Y %H:%M")

        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }}
                .container {{ max-width: 650px; margin: 0 auto; background: white;
                             border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(135deg, #ff416c, #ff4b2b);
                          padding: 20px; color: white; text-align: center; }}
                .header h1 {{ margin: 0; font-size: 22px; }}
                .content {{ padding: 20px; }}
                .anomaly-card {{ background: #f8f9fa; border-left: 4px solid #ff416c;
                                padding: 15px; margin: 12px 0; border-radius: 5px; }}
                .anomaly-card.high {{ border-left-color: #dc3545; background: #fff3f3; }}
                .anomaly-card.medium {{ border-left-color: #fd7e14; background: #fff8f0; }}
                .severity-badge {{ display: inline-block; background: #dc3545; color: white;
                                  padding: 3px 10px; border-radius: 12px; font-size: 13px;
                                  font-weight: bold; }}
                .severity-badge.medium {{ background: #fd7e14; }}
                .hotel-name {{ font-size: 18px; font-weight: bold; color: #333; margin: 8px 0 4px; }}
                .destination {{ color: #666; font-size: 14px; }}
                .explanation {{ color: #444; font-size: 14px; margin: 10px 0; line-height: 1.5; }}
                .signal-tags {{ margin: 8px 0; }}
                .signal-tag {{ display: inline-block; background: #e9ecef; color: #495057;
                              padding: 2px 8px; border-radius: 3px; font-size: 12px; margin: 2px; }}
                .signal-tag.active {{ background: #28a745; color: white; }}
                .cta {{ display: inline-block; background: #dc3545; color: white;
                       padding: 10px 20px; text-decoration: none; border-radius: 5px;
                       margin-top: 10px; font-weight: bold; }}
                .footer {{ padding: 15px; text-align: center; color: #999; font-size: 12px;
                          border-top: 1px solid #eee; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚨 ANOMALÍAS DE PRECIO DETECTADAS</h1>
                    <p>{now} · {len(anomalies)} anomalía(s)</p>
                </div>
                <div class="content">
        """

        for anomaly in anomalies:
            score = anomaly.get("severity_score", 0)
            card_class = "anomaly-card high" if score >= 75 else "anomaly-card medium"
            badge_class = "severity-badge" if score >= 75 else "severity-badge medium"

            # Señales
            signals = anomaly.get("signals", {})
            signal_tags = ""
            for sig_name, sig_val in [
                ("Habitación", signals.get("room_type", 0)),
                ("Zona", signals.get("zone", 0)),
                ("Temporada", signals.get("seasonal", 0)),
            ]:
                tag_class = "signal-tag active" if sig_val > 0 else "signal-tag"
                signal_tags += f'<span class="{tag_class}">{sig_name}: {sig_val}</span>'

            # Tipo legible
            type_labels = {
                "room_type_mispricing": "Error tipo habitación",
                "zone_outlier_low": "Outlier de zona",
                "seasonal_pricing_error": "Anomalía estacional",
            }
            type_label = type_labels.get(anomaly.get("anomaly_type", ""), "Anomalía")

            html += f"""
                <div class="{card_class}">
                    <span class="{badge_class}">{score}/100</span>
                    <span style="color: #666; font-size: 12px; margin-left: 8px;">{type_label}</span>
                    <div class="hotel-name">{anomaly.get('hotel_name', 'Hotel')}</div>
                    <div class="destination">
                        {anomaly.get('destination', '')} · {anomaly.get('checkin', '')} → {anomaly.get('checkout', '')}
                    </div>
                    <div class="explanation">{anomaly.get('explanation', '')}</div>
                    <div class="signal-tags">{signal_tags}</div>
                    <a href="{anomaly.get('booking_url', '#')}" class="cta">Verificar en Booking →</a>
                </div>
            """

        html += """
                </div>
                <div class="footer">
                    Travel Hunter · Detector de Anomalías de Precio<br>
                    <small>Verifica siempre antes de reservar. Los errores se corrigen rápido.</small>
                </div>
            </div>
        </body>
        </html>
        """
        return html

    # =========================================================================
    # ENVIAR NOTIFICACIONES
    # =========================================================================

    def notify_anomalies(self, anomalies: List[dict]):
        """Envía notificación de anomalías de hotel detectadas."""
        if not anomalies:
            return

        top_score = max(a.get("severity_score", 0) for a in anomalies)
        urgency = "🚨" if top_score >= 80 else "⚠️"

        subject = (
            f"{urgency} {len(anomalies)} anomalía(s) de precio en hoteles "
            f"(max: {top_score}/100)"
        )

        html = self._anomaly_alert_html(anomalies)
        self._send_email(subject, html)

    def notify_flight_alerts(self, alerts: List[dict], search_params: dict = None):
        """Envía notificación de alertas de vuelos."""
        if not alerts:
            return

        has_errors = any(a.get("type") == "price_error" for a in alerts)
        subject = (
            "🚨 ERROR DE PRECIO en vuelo detectado!"
            if has_errors
            else f"✈️ {len(alerts)} ofertas de vuelo encontradas"
        )

        html = self._flight_alert_html(alerts, search_params)
        self._send_email(subject, html)

    def notify_hotel_alerts(self, alerts: List[dict], search_params: dict = None):
        """Envía notificación de alertas de hoteles (separada de vuelos)."""
        if not alerts:
            return

        subject = f"🏨 {len(alerts)} ofertas de hotel encontradas"
        html = self._hotel_alert_html(alerts, search_params)
        self._send_email(subject, html)

    def notify_search_summary(
        self,
        flight_results: list,
        hotel_results: list,
        urls: dict,
        search_params: dict,
    ):
        """Envía resumen completo de búsqueda."""
        subject = "📊 Travel Hunter - Resumen de búsqueda"
        html = self._summary_html(flight_results, hotel_results, urls, search_params)
        self._send_email(subject, html)

    def notify_error(self, error_msg: str, context: str = ""):
        """Envía notificación de error del sistema."""
        subject = "⚠️ Travel Hunter - Error en búsqueda"
        html = f"""
        <html><body>
            <h2>Error en Travel Hunter</h2>
            <p><strong>Contexto:</strong> {context}</p>
            <p><strong>Error:</strong> {error_msg}</p>
            <p><em>Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}</em></p>
        </body></html>
        """
        self._send_email(subject, html)


class ConsoleNotifier:
    """Notificador de consola para cuando no hay email configurado."""

    @staticmethod
    def print_flight_alerts(alerts: List[dict]):
        """Muestra alertas de vuelos en consola."""
        if not alerts:
            return

        print("\n" + "=" * 60)
        print("✈️  ALERTAS DE VUELOS")
        print("=" * 60)

        for alert in alerts:
            if alert.get("type") == "price_error":
                print(f"\n🚨 ERROR DE PRECIO - {alert['airline']}")
                print(f"   Ruta: {alert['route']}")
                print(f"   Agregadores: {alert['aggregator_price']}€")
                print(f"   Precio directo: {alert['direct_price']}€")
                print(f"   Ahorras: {alert['savings']}€ ({alert['difference_percent']}%)")
                print(f"   ⚠️  ¡Actúa rápido! Los errores se corrigen pronto")
                print(f"   URL: {alert.get('direct_url', 'N/A')}")
            elif alert.get("type") == "price_drop":
                print(f"\n📉 BAJADA DE PRECIO - {alert['airline']}")
                print(f"   Ruta: {alert['route']}")
                print(f"   Antes: {alert['old_price']}€ → Ahora: {alert['new_price']}€")
                print(f"   Bajada: {alert['drop_percent']}%")
                print(f"   Precio medio: {alert.get('avg_price', 'N/A')}€")
            elif alert.get("type") == "aggregator_deal":
                print(f"\n💰 OFERTA EN AGREGADOR - {alert['airline']}")
                print(f"   Web directa: {alert['direct_price']}€")
                print(f"   {alert['aggregator_platform']}: {alert['aggregator_price']}€")
                print(f"   Ahorras: {alert['savings']}€")

    @staticmethod
    def print_hotel_alerts(alerts: List[dict]):
        """Muestra alertas de hoteles en consola."""
        if not alerts:
            return

        print("\n" + "=" * 60)
        print("🏨 ALERTAS DE HOTELES")
        print("=" * 60)

        for alert in alerts:
            print(f"\n📉 {alert.get('name', 'Hotel')}")
            print(f"   {alert.get('platform', '')} · {alert.get('dates', '')}")
            print(f"   Antes: {alert.get('old_price', 'N/A')}€ → Ahora: {alert.get('new_price', 'N/A')}€")
            print(f"   Bajada: {alert.get('drop_percent', 0)}%")

    @staticmethod
    def print_anomaly_alerts(anomalies: List[dict]):
        """Muestra anomalías de hotel en consola."""
        if not anomalies:
            return

        print("\n" + "=" * 60)
        print("🚨 ANOMALÍAS DE PRECIO EN HOTELES")
        print("=" * 60)

        for a in anomalies:
            score = a.get("severity_score", 0)
            icon = "🔴" if score >= 80 else "🟠" if score >= 60 else "🟡"
            print(f"\n{icon} [{score}/100] {a.get('hotel_name', 'Hotel')}")
            print(f"   📍 {a.get('destination', '')} · {a.get('checkin', '')} → {a.get('checkout', '')}")
            print(f"   📝 {a.get('explanation', '')}")
            signals = a.get("signals", {})
            active = [f"{k}={v}" for k, v in signals.items() if v > 0]
            if active:
                print(f"   📊 Señales: {', '.join(active)}")
            if a.get("booking_url"):
                print(f"   🔗 {a['booking_url'][:80]}...")

    @staticmethod
    def print_search_summary(flight_results, hotel_results, urls):
        """Muestra resumen en consola."""
        print("\n" + "=" * 60)
        print("📊 RESUMEN DE BÚSQUEDA")
        print("=" * 60)

        if flight_results:
            print("\n✈️  TOP 5 VUELOS MÁS BARATOS:")
            print("-" * 50)
            for i, f in enumerate(flight_results[:5], 1):
                print(f"   {i}. {f.airline:<15} {f.price:>8.2f}€  "
                      f"({f.platform}) {f.stops} escalas {f.duration}")
        else:
            print("\n✈️  No se pudieron extraer precios de vuelos automáticamente.")

        if hotel_results:
            print("\n🏨 TOP 5 HOTELES MÁS BARATOS:")
            print("-" * 50)
            for i, h in enumerate(hotel_results[:5], 1):
                print(f"   {i}. {h.name[:25]:<25} {h.price_total:>8.2f}€  "
                      f"({h.platform}) ★{h.rating}")
        else:
            print("\n🏨 No se pudieron extraer precios de hoteles automáticamente.")

        print("\n🔗 ENLACES DIRECTOS (siempre disponibles):")
        print("-" * 50)
        for name, url in urls.items():
            print(f"   {name}: {url[:80]}...")
