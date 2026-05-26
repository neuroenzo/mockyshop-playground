FROM ghcr.io/astral-sh/uv:python3.13-alpine AS builder

WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --no-dev --frozen --no-install-project

COPY app/ app/
COPY alembic.ini .
RUN uv sync --no-dev --frozen

FROM python:3.13-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/.venv .venv/
COPY --from=builder /app/app app/
COPY --from=builder /app/alembic.ini .

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
