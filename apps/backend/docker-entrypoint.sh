#!/bin/sh
set -e

echo "[entrypoint] running database migrations…"
alembic upgrade head

echo "[entrypoint] seeding (idempotent)…"
python -m app.seeds.seed

echo "[entrypoint] starting uvicorn…"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
