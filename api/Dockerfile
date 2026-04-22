# TripCazador API — multi-stage Dockerfile
# ==========================================
# Stage 1 (builder): instala deps en una venv aislada.
# Stage 2 (runtime): imagen slim, copia solo la venv, usuario no-root.

# ── Stage 1: builder ──────────────────────────────
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

# Compilar deps en una venv que se copiará en runtime
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY api/requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt


# ── Stage 2: runtime ──────────────────────────────
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

# curl para healthcheck; tini para init de señales
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl tini \
    && rm -rf /var/lib/apt/lists/*

# Usuario no-root (defensa en profundidad)
RUN groupadd --system --gid 1001 app \
 && useradd --system --uid 1001 --gid app --shell /usr/sbin/nologin app

# Copiar la venv compilada desde el builder
COPY --from=builder /opt/venv /opt/venv

WORKDIR /app
# Código de la API (main.py + todo lo de api/)
COPY --chown=app:app api/ /app/
# Motores de búsqueda que el endpoint /api/search/live necesita importar.
# Se copian aislados para mantener la imagen ligera (no traemos todo el worker).
COPY --chown=app:app flight_hunter_v4/rapidapi_engine.py /app/rapidapi_engine.py
COPY --chown=app:app flight_hunter_v4/ryanair_engine.py /app/ryanair_engine.py
COPY --chown=app:app flight_hunter_v4/config.py /app/config.py
COPY --chown=app:app flight_hunter_v4/circuit_breaker.py /app/circuit_breaker.py
COPY --chown=app:app flight_hunter_v4/geo_data.py /app/geo_data.py

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost:8000/api/health || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
