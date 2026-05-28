# PetFood — Frontend Next

Отдельный фронтенд рядом с `frontend-main`.

## Локальный запуск (если установлен Node)

```bash
cd frontend-next
npm i
npm run dev
```

По умолчанию поднимается на `http://localhost:5174` (strictPort).

## Запуск без Node (через Docker)

Из корня репозитория:

```bash
docker run --rm -it \
  -p 5174:5174 \
  -w /app/frontend-next \
  -v "$PWD:/app" \
  node:20-bullseye \
  bash -lc "npm i && npm run dev -- --host 0.0.0.0 --port 5174 --strictPort"
```

## Proxy

Dev-proxy настроен в `vite.config.ts`:
- `/api` → `http://10.1.10.144:8090`
- `/recommender` → `http://10.1.10.144:8000`

Если нужно переопределить базовый URL (например, для prod), используй:

```env
VITE_API_BASE_URL=
```

