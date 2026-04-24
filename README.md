# 🐕 PetFood Platform - Инструкция по запуску

## 📋 Требования

- **Docker** (версия 20+)
- **Docker Compose** (встроен в Docker)
- **Java 21** (уже установлена)
- Минимум **8GB RAM** для всех сервисов
- Свободное место на диске: **20GB**

## 🚀 Быстрый старт (5 шагов)

### 1️⃣ Убедитесь, что находитесь в правильной директории
```bash
cd /home/iot/PetFood/petfood_platforma
ls -la
# Должны быть видны: docker-compose.yml, .env, nginx.conf, run.sh и папки services
```

### 2️⃣ Проверьте конфигурацию
```bash
cat .env
# Убедитесь, что все переменные окружения установлены
```

### 3️⃣ Запустите все сервисы (первый запуск - 10-15 минут)
```bash
./run.sh start
```

Это команда:
- Собирает все Docker образы из исходного кода
- Запускает все контейнеры
- Проверяет здоровье сервисов
- Показывает информацию для доступа

### 4️⃣ Дождитесь готовности всех сервисов
Когда увидите все "✓" в проверке здоровья - система готова!

### 5️⃣ Откройте в браузере
```
http://10.1.10.144:5555
```

## 📡 Доступные сервисы

Все сервисы доступны через единую точку входа `http://10.1.10.144:5555`:

| Сервис | URL | Описание |
|--------|-----|---------|
| **Frontend** | http://10.1.10.144:5555 | Главное веб-приложение |
| **API Gateway** | http://10.1.10.144:5555/api | REST API для фронтенда |
| **AI Recommender** | http://10.1.10.144:5555/recommender/docs | Рекомендации по питанию |
| **MinIO Console** | http://10.1.10.144:5555/minio-console | Управление хранилищем |
| **RabbitMQ** | http://10.1.10.144:5555/rabbitmq | Управление сообщениями |

## 🔑 Учетные данные

```
MinIO Console:
  User:     minioadmin
  Password: minioadmin

RabbitMQ Management:
  User:     guest
  Password: guest

PostgreSQL Database:
  Host:     localhost
  Port:     5432
  User:     postgres
  Password: postgres123
  Database: pets_db
```

## 📊 Управление сервисами

### Просмотр статуса всех контейнеров
```bash
./run.sh status
```

### Просмотр логов (streaming)
```bash
# Все логи
./run.sh logs

# Логи конкретного сервиса
./run.sh logs gateway-service
./run.sh logs auth-service
./run.sh logs pets-service
./run.sh logs recommender-api
./run.sh logs frontend
```

### Остановить все сервисы
```bash
./run.sh stop
```

### Перезапустить все сервисы
```bash
./run.sh restart
```

### Проверить здоровье сервисов
```bash
./run.sh health
```

### Полная информация о сервисах
```bash
./run.sh info
```

## 🆘 Решение проблем

### Сервисы не запускаются

**Ошибка**: "Cannot connect to Docker daemon"
```bash
sudo systemctl start docker
# или
sudo service docker start
```

**Ошибка**: "Permission denied while trying to connect to Docker daemon"
```bash
# Добавьте пользователя в группу docker
sudo usermod -aG docker $USER
sudo systemctl restart docker
# Переподключитесь или выполните: newgrp docker
```

### Проблемы с памятью

Если сервисы перезагружаются, увеличьте лимит памяти Docker:
```bash
# Редактируйте Docker Desktop Settings или
# Для Linux, отредактируйте /etc/docker/daemon.json
{
  "memory": 8589934592,
  "memory-swap": 8589934592
}
```

### Порт 5555 занят

```bash
# Проверьте, что использует порт
sudo lsof -i :5555

# Измените порт в docker-compose.yml на другой (например, 5556)
# Найдите строку:
#   ports:
#     - "5555:5555"
# Измените на:
#   ports:
#     - "5556:5555"
```

### Очистить всё и начать заново

```bash
# Остановить и удалить все контейнеры и данные
./run.sh stop
docker compose down -v

# Очистить кеш Docker
docker system prune -a

# Запустить заново
./run.sh start
```

## 📚 Архитектура сервисов

```
Frontend (React/Vite)
    ↓
Nginx Reverse Proxy (Port 5555)
    ├→ API Gateway (Port 8090)
    │   ├→ Auth Service (Port 8082)
    │   ├→ Account Service (Port 8081)
    │   └→ Pets Service (Port 8083)
    │       └→ MinIO S3 (Port 9000)
    ├→ Recommender API (Python/FastAPI - Port 8000)
    └→ Message Queue (RabbitMQ - Port 5672)
            └→ Notifications Service (Port 8084)

Database Layer:
├→ PostgreSQL (Port 5432)
├→ Redis (Port 6379)
└→ MinIO (Ports 9000, 9001)
```

## 🔧 Переменные окружения

Редактируйте `.env` файл для изменения конфигурации:

```bash
# Сервер
SERVER_IP=10.1.10.144
SERVER_PORT=5555

# База данных
POSTGRES_DB=pets_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123

# RabbitMQ
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest

# MinIO S3
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
PETS_MINIO_BUCKET=pets

# Email уведомления (опционально)
SMTP_GMAIL_USER=
SMTP_GMAIL_PASS=
SMTP_GMAIL_FROM=
```

После изменений перезапустите сервисы:
```bash
./run.sh restart
```

## 💻 Прямое взаимодействие с Docker

Если скрипт `run.sh` не работает, используйте Docker Compose напрямую:

```bash
# Запустить
docker compose up --build -d

# Остановить
docker compose down

# Логи
docker compose logs -f

# Статус
docker compose ps
```

## 🐛 Отладка

### Войти в контейнер сервиса
```bash
# Список всех контейнеров
docker ps

# Войти в контейнер
docker exec -it pets_gateway_service /bin/bash
```

### Проверить network
```bash
docker network inspect pets_network
```

### Посмотреть использование ресурсов
```bash
docker stats
```

## 📝 Логи по компонентам

```bash
# Backend services
docker compose logs -f auth-service
docker compose logs -f account-service
docker compose logs -f pets-service
docker compose logs -f notifications-service
docker compose logs -f gateway-service

# Infrastructure
docker compose logs -f postgres
docker compose logs -f redis
docker compose logs -f rabbitmq
docker compose logs -f minio

# Frontend & Proxy
docker compose logs -f frontend
docker compose logs -f nginx

# AI
docker compose logs -f recommender-api
```

## ✅ Проверка готовности

После запуска выполните проверку:

```bash
# 1. Проверить все контейнеры запущены
docker compose ps

# 2. Проверить доступ к API
curl -s http://10.1.10.144:5555/api/v1/health | jq .

# 3. Открыть в браузере
# http://10.1.10.144:5555
```

## 🎯 Первые шаги с платформой

1. **Создайте аккаунт** через веб-интерфейс
2. **Добавьте питомца** в профиль
3. **Получите рекомендации по питанию** через AI сервис
4. **Создавайте рецепты** для вашего питомца

---

**Успешного запуска! 🐕💚**

Если возникнут проблемы - проверьте логи сервисов:
```bash
./run.sh logs
```
