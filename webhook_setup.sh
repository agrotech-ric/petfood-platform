#!/bin/bash

# Настройка GitHub Webhook для автоматического деплоя
# Этот скрипт запускает webhook сервер

set -e

PROJECT_DIR="/home/iot/PetFood/petfood_platforma"
WEBHOOK_PORT=9000
GITHUB_SECRET="your-secret-key"  # Измените на реальный!

echo "🔧 PetFood Webhook Setup"
echo "========================"

# 1. Проверяем Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не установлен"
    exit 1
fi

echo "✓ Python3 установлен: $(python3 --version)"

# 2. Проверяем Git
if ! command -v git &> /dev/null; then
    echo "❌ Git не установлен"
    exit 1
fi

echo "✓ Git установлен: $(git --version)"

# 3. Создаём systemd сервис для webhook (опционально)
if [ "$1" == "--install" ]; then
    echo ""
    echo "📦 Устанавливаю systemd сервис..."

    sudo tee /etc/systemd/system/petfood-webhook.service > /dev/null <<EOF
[Unit]
Description=PetFood Auto Deploy Webhook
After=network.target docker.service
Wants=docker.service

[Service]
Type=simple
User=iot
WorkingDirectory=$PROJECT_DIR
ExecStart=$(which python3) webhook_server.py
Environment="WEBHOOK_PORT=$WEBHOOK_PORT"
Environment="GITHUB_WEBHOOK_SECRET=$GITHUB_SECRET"
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable petfood-webhook
    sudo systemctl start petfood-webhook

    echo "✓ Сервис установлен и запущен!"
    echo ""
    echo "Команды для управления:"
    echo "  sudo systemctl status petfood-webhook      # Статус"
    echo "  sudo systemctl restart petfood-webhook     # Перезапуск"
    echo "  sudo journalctl -u petfood-webhook -f      # Логи"
fi

# 4. Запуск webhook'а в терминале (для тестирования)
if [ "$1" == "--run" ]; then
    echo ""
    echo "🚀 Запускаю webhook сервер..."
    echo "📡 Слушаю на порту $WEBHOOK_PORT"
    echo ""
    echo "Настройте GitHub webhook:"
    echo "  URL: http://<YOUR_IP_OR_DOMAIN>:$WEBHOOK_PORT/deploy"
    echo "  Secret: $GITHUB_SECRET"
    echo "  Events: Push events"
    echo ""

    cd "$PROJECT_DIR"
    WEBHOOK_PORT=$WEBHOOK_PORT GITHUB_WEBHOOK_SECRET=$GITHUB_SECRET \
        python3 webhook_server.py
fi

# 5. Показываем инструкции
cat << 'EOF'

📖 Инструкция по настройке GitHub Webhook
==========================================

1. Генерируйте random secret (используйте вместо 'your-secret-key'):
   openssl rand -hex 32

2. В GitHub репо перейдите:
   Settings → Webhooks → Add webhook

3. Заполните форму:
   - Payload URL: http://10.1.10.144:9000/deploy
   - Content type: application/json
   - Secret: <ваш-сгенерированный-секрет>
   - Events:
     ☑ Push events
     ☐ Pull requests
     ☐ Другое...
   - Active: ☑

4. Запустите webhook сервер одним из способов:

   📌 Вариант A: В терминале (для тестирования)
      cd /home/iot/PetFood/petfood_platforma
      python3 webhook_server.py

   📌 Вариант B: Systemd сервис (для production)
      # Сначала отредактируйте webhook_server.py или установите переменные:
      export GITHUB_WEBHOOK_SECRET="ваш-секрет"
      ./webhook_setup.sh --install

      # Проверьте статус:
      sudo systemctl status petfood-webhook

      # Логи:
      sudo journalctl -u petfood-webhook -f

5. Логи деплоя:
   tail -f /home/iot/PetFood/petfood_platforma/deploy.log

6. Тестирование webhook'а:
   curl -X POST http://localhost:9000/deploy \
     -H "Content-Type: application/json" \
     -H "X-Hub-Signature-256: sha256=..." \
     -d '{"ref":"refs/heads/main"}'

⚠️  ВАЖНО:
   - Измените GITHUB_SECRET в webhook_server.py!
   - Используйте HTTPS в production (через reverse proxy)
   - Проверьте, что порт 9000 открыт в firewall
EOF
