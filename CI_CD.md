# 🚀 Варианты автоматического деплоя

Ниже представлены **три проверенных варианта** для автоматического развёртывания при коммитах в `main` ветку GitHub.

---

## 📊 Быстрое сравнение

| Вариант | Сложность | Скорость | Надёжность | Для кого | Хосты |
|---------|-----------|----------|-----------|----------|-------|
| **GitHub Actions** | 🟡 Средняя | ~2 мин | ⭐⭐⭐⭐⭐ | Облако, CI/CD | GitHub |
| **Webhook** | 🟢 Простая | ~1 мин | ⭐⭐⭐⭐ | Локальный сервер | Ваш сервер |
| **Systemd Timer** | 🟢 Простая | ~5 мин | ⭐⭐⭐ | Локальный сервер | Ваш сервер |

**🎯 Рекомендация**: Используйте **Webhook** для локального сервера (вариант 2).

---

## ✅ Вариант 1: GitHub Actions (облачный CI/CD)

Автоматически тестирует и деплоит при push в main на облачных серверах GitHub.

### Плюсы
- ✅ Встроено в GitHub
- ✅ Бесплатный
- ✅ Надёжный и безопасный
- ✅ Хороший logging

### Минусы
- ❌ Требует доступ в интернет к GitHub
- ❌ Немного медленнее (2-3 минуты)
- ❌ Нужен SSH ключ

### Настройка

#### 1. Создайте SSH ключ для деплоя

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github-deploy -N ""
cat ~/.ssh/github-deploy
# Скопируйте содержимое приватного ключа
```

#### 2. Добавьте SSH публичный ключ на сервер

```bash
cat ~/.ssh/github-deploy.pub >> ~/.ssh/authorized_keys
```

#### 3. Создайте GitHub Actions workflow

```bash
mkdir -p /home/iot/PetFood/petfood_platforma/.github/workflows
```

Создайте файл `.github/workflows/deploy.yml`:

```yaml
name: Auto Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_IP }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: 22
          script: |
            cd /home/iot/PetFood/petfood_platforma
            git pull origin main
            docker compose down -v
            docker compose up --build -d
            docker compose ps
```

#### 4. Добавьте Secrets в GitHub

В GitHub репо → Settings → Secrets and variables → Actions → New repository secret:

- **SSH_PRIVATE_KEY**: содержимое файла `~/.ssh/github-deploy`
- **SERVER_IP**: `10.1.10.144`
- **SSH_USER**: `iot`

#### 5. Тест

Сделайте push в main и смотрите в GitHub Actions → Workflows

---

## ✅ Вариант 2: GitHub Webhook (рекомендуется) ⭐

Ваш локальный сервер слушает webhook от GitHub и сразу деплоит.

### Плюсы
- ✅ Очень простой
- ✅ Быстрый деплой (~1 минута)
- ✅ Работает локально
- ✅ Надёжный

### Минусы
- ❌ Требует открыть порт на firewall
- ❌ Нужен доступ в интернет из GitHub

### Настройка

#### 1. Запустите webhook сервер

**Вариант A: В терминале (для тестирования)**

```bash
cd /home/iot/PetFood/petfood_platforma
python3 webhook_server.py
```

Вывод:
```
🚀 Webhook server running on 0.0.0.0:9000
📝 Logs: /home/iot/PetFood/petfood_platforma/deploy.log
```

**Вариант B: Systemd сервис (автозапуск)**

```bash
# Отредактируйте webhook_server.py и установите GITHUB_SECRET
nano webhook_server.py
# Найдите строку: GITHUB_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET", "your-secret-key")
# Измените "your-secret-key" на реальный секрет или экспортируйте переменную

# Установите как systemd сервис
cd /home/iot/PetFood/petfood_platforma
chmod +x webhook_setup.sh
./webhook_setup.sh --install

# Проверьте статус
sudo systemctl status petfood-webhook

# Логи
sudo journalctl -u petfood-webhook -f
```

#### 2. Сгенерируйте webhook secret

```bash
openssl rand -hex 32
# Вывод: 3f6c5b8a9e2d1c4f7a9b8c5d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5
```

#### 3. Настройте webhook в GitHub

Перейдите в репо:
- **Settings** → **Webhooks** → **Add webhook**

Заполните:
- **Payload URL**: `http://10.1.10.144:9000/deploy`
- **Content type**: `application/json`
- **Secret**: `3f6c5b8a9e2d1c4f7a9b8c5d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5` (ваш секрет)
- **Events**: Выберите "Just the push event"
- **Active**: ☑️ Отмечено

Нажмите **Add webhook**

#### 4. Тест webhook'а

```bash
# GitHub отправит тестовый запрос
# Проверьте логи
tail -f /home/iot/PetFood/petfood_platforma/deploy.log

# Или смотрите в GitHub репо → Settings → Webhooks → (ваш webhook) → Recent Deliveries
```

---

## ✅ Вариант 3: Systemd Timer (простой локальный polling)

Cron job, который каждые 5 минут проверяет наличие новых коммитов и деплоит.

### Плюсы
- ✅ Очень простой
- ✅ Не требует webhook
- ✅ Встроено в Linux

### Минусы
- ❌ Деплоит не мгновенно (с задержкой до 5 минут)
- ❌ Более ресурсозатратно

### Настройка

#### 1. Создайте deploy скрипт

```bash
cat > /home/iot/PetFood/petfood_platforma/auto-deploy.sh << 'EOF'
#!/bin/bash
set -e

PROJECT_DIR="/home/iot/PetFood/petfood_platforma"
LOG_FILE="$PROJECT_DIR/auto-deploy.log"

cd "$PROJECT_DIR"

# Получить текущий коммит
OLD_COMMIT=$(git rev-parse HEAD)

# Fetch последних изменений
git fetch origin main

# Получить коммит с remote
NEW_COMMIT=$(git rev-parse origin/main)

# Если есть новые коммиты - деплоим
if [ "$OLD_COMMIT" != "$NEW_COMMIT" ]; then
    echo "[$(date)] New commits detected! Deploying..." >> "$LOG_FILE"

    git reset --hard origin/main
    
    # Docker деплой
    docker compose down -v
    docker compose up --build -d
    
    echo "[$(date)] Deploy completed successfully!" >> "$LOG_FILE"
else
    echo "[$(date)] No new commits" >> "$LOG_FILE"
fi
EOF

chmod +x /home/iot/PetFood/petfood_platforma/auto-deploy.sh
```

#### 2. Создайте systemd service

```bash
sudo tee /etc/systemd/system/petfood-auto-deploy.service > /dev/null <<'EOF'
[Unit]
Description=PetFood Auto Deploy Timer
After=docker.service
Wants=docker.service

[Service]
Type=oneshot
User=iot
WorkingDirectory=/home/iot/PetFood/petfood_platforma
ExecStart=/home/iot/PetFood/petfood_platforma/auto-deploy.sh
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
```

#### 3. Создайте systemd timer (каждые 5 минут)

```bash
sudo tee /etc/systemd/system/petfood-auto-deploy.timer > /dev/null <<'EOF'
[Unit]
Description=PetFood Auto Deploy Timer
Requires=petfood-auto-deploy.service

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min
AccuracySec=1sec

[Install]
WantedBy=timers.target
EOF
```

#### 4. Включите и запустите

```bash
sudo systemctl daemon-reload
sudo systemctl enable petfood-auto-deploy.timer
sudo systemctl start petfood-auto-deploy.timer

# Проверьте статус
sudo systemctl status petfood-auto-deploy.timer
sudo systemctl list-timers

# Логи
sudo journalctl -u petfood-auto-deploy -f
```

---

## 🔧 Troubleshooting

### Webhook не работает

```bash
# Проверьте, запущен ли сервер
curl http://localhost:9000/deploy

# Смотрите логи
tail -f /home/iot/PetFood/petfood_platforma/deploy.log

# Проверьте firewall
sudo ufw status
sudo ufw allow 9000  # Если нужно открыть

# Тестируйте локально
python3 /home/iot/PetFood/petfood_platforma/webhook_server.py
```

### GitHub Actions не работает

```bash
# Проверьте SSH ключ
ssh -i ~/.ssh/github-deploy iot@10.1.10.144 "cd /home/iot/PetFood && pwd"

# Смотрите логи в GitHub → Actions → Workflows
```

### Проблема с Docker при деплое

```bash
# Проверьте права пользователя iot
groups iot

# Добавьте в группу docker если нужно
sudo usermod -aG docker iot

# Перезагрузитесь
newgrp docker
```

---

## 📝 Финальная настройка

Какой бы вариант вы ни выбрали, убедитесь что:

1. ✅ Git репо инициализирован
```bash
cd /home/iot/PetFood/petfood_platforma
git remote -v  # Должен показать origin
git status     # Должно быть clean или committed changes
```

2. ✅ `.env` файл сохранён (не коммитится в git)
```bash
echo ".env" >> .gitignore
```

3. ✅ Docker работает
```bash
docker ps  # Должны быть контейнеры
```

4. ✅ GitHub репо имеет правильный URL
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/PetFood.git
# или для SSH:
git remote set-url origin git@github.com:YOUR_USERNAME/PetFood.git
```

5. ✅ Проверьте основную ветку
```bash
git branch -a
git log --oneline | head -5
```

---

**Готово! Выберите удобный вариант и начните использовать автоматический деплой! 🚀**
