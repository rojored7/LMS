FROM python:3.12-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir .

COPY alembic.ini .
COPY alembic/ alembic/
COPY app/ app/

EXPOSE 4000

# --- Development ---
FROM base AS development
RUN pip install --no-cache-dir ".[dev]"
# Hot reload with uvicorn --reload
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "4000", "--reload"]

# --- Production ---
FROM base AS production
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser
CMD ["gunicorn", "app.main:app", "--bind", "0.0.0.0:4000", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--timeout", "120", "--graceful-timeout", "30", "--keep-alive", "5", "--access-logfile", "-", "--error-logfile", "-"]
