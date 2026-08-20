#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

case "${1:-}" in
  start)
    docker compose -f docker-compose.sandbox.yml up -d --build
    docker start petfood_frontend_next_dev 2>/dev/null || \
      docker run -d --name petfood_frontend_next_dev --restart unless-stopped \
        -p 5174:5174 -v "$(pwd):/app" -w /app/frontend-next node:20-bullseye \
        bash -lc "npm ci && npm run dev -- --host 0.0.0.0 --port 5174"
    ;;
  stop)
    docker compose -f docker-compose.sandbox.yml down
    docker stop petfood_frontend_next_dev 2>/dev/null || true
    ;;
  update)
    git pull origin beta
    docker compose -f docker-compose.sandbox.yml up -d --build
    docker restart petfood_frontend_next_dev
    ;;
  logs)
    docker logs -f petfood_frontend_next_dev
    ;;
  status)
    docker compose -f docker-compose.sandbox.yml ps
    docker ps --filter name=petfood_frontend_next_dev
    ;;
  *)
    echo "Usage: $0 {start|stop|update|logs|status}"
    exit 1
    ;;
esac
