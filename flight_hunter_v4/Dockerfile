# TripCazador Worker (Flight Hunter v4) — multi-stage Dockerfile
# ===============================================================
# Worker con cron interno (APScheduler) que busca deals cada 6h.

# ── Stage 1: builder ──────────────────────────────
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip \
 && pip install -r requirements.txt \
 && pip install ryanair-py


# ── Stage 2: runtime ──────────────────────────────
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl tini \
    && rm -rf /var/lib/apt/lists/*

# Usuario no-root
RUN groupadd --system --gid 1001 app \
 && useradd --system --uid 1001 --gid app --shell /usr/sbin/nologin app

COPY --from=builder /opt/venv /opt/venv

WORKDIR /app
COPY --chown=app:app . .
RUN mkdir -p /app/output && chown -R app:app /app/output

USER app

# Healthcheck: comprueba que el cron_runner siga arrancando deals.json
# (modificación en las últimas 12h ⇒ worker vivo).
HEALTHCHECK --interval=5m --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import os, sys, time; p='/app/output/deals.json'; \
      sys.exit(0 if os.path.exists(p) and (time.time()-os.path.getmtime(p)) < 43200 else 1)"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["python", "/app/cron_runner.py"]
