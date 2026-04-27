#!/bin/bash
set -e

echo "🚀 GitHub Actions Self-Hosted Runner Installation Script"
echo "=========================================================="
echo ""

RUNNER_DIR="/home/iot/PetFood/petfood_platforma/actions-runner"
SERVICE_NAME="actions.runner.agrotech-ric-petfood-platform.debian-prod-1"

# 1. Проверяем переменные окружения
if [ -z "$GITHUB_RUNNER_TOKEN" ]; then
    echo "❌ GITHUB_RUNNER_TOKEN не установлен"
    echo ""
    echo "Как это исправить:"
    echo "1. Открой GitHub репозиторий:"
    echo "   https://github.com/agrotech-ric/petfood-platform"
    echo ""
    echo "2. Перейди: Settings → Actions → Runners → New self-hosted runner"
    echo ""
    echo "3. Скопируй token из раздела 'Configure' (под стрелкой ↓ Linux)"
    echo ""
    echo "4. Выполни:"
    echo "   export GITHUB_RUNNER_TOKEN='твой_токен_здесь'"
    echo "   $0"
    echo ""
    exit 1
fi

echo "✓ Token найден"
echo ""

# 2. Останавливаем и удаляем старый сервис
echo "📌 Очистка старого сервиса..."
sudo systemctl stop $SERVICE_NAME.service 2>/dev/null || true
sudo systemctl disable $SERVICE_NAME.service 2>/dev/null || true
sudo rm -f /etc/systemd/system/$SERVICE_NAME.service 2>/dev/null || true
sudo systemctl daemon-reload

# 3. Убиваем старые процессы раннера
echo "📌 Завершение старых процессов раннера..."
pkill -f "Runner.Listener" || true
pkill -f "runsvc.sh" || true
sleep 2

# 4. Очищаем старые конфиги регистрации
echo "📌 Очистка старых конфигов..."
cd "$RUNNER_DIR"
rm -f .credentials .credentials_rsaparams .runner .path .env
rm -rf _diag/*

# 5. Регистрируем новый runner
echo "📌 Регистрация раннера в GitHub..."
./config.sh \
    --url https://github.com/agrotech-ric/petfood-platform \
    --token "$GITHUB_RUNNER_TOKEN" \
    --labels petfood-prod \
    --name debian-prod-1 \
    --unattended \
    --replace

if [ ! -f .runner ]; then
    echo "❌ Регистрация не удалась (.runner файл не создан)"
    exit 1
fi

echo "✓ Раннер зарегистрирован"
echo ""

# 6. Устанавливаем и запускаем systemd сервис
echo "📌 Установка systemd сервиса..."
sudo ./svc.sh install
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME.service
sudo systemctl start $SERVICE_NAME.service

# 7. Проверяем статус
echo ""
echo "📌 Проверка статуса сервиса..."
sleep 3

if sudo systemctl is-active --quiet $SERVICE_NAME.service; then
    echo "✓ Сервис активен"
else
    echo "❌ Сервис не запустился!"
    echo ""
    echo "Диагностика:"
    sudo systemctl status $SERVICE_NAME.service --no-pager -l
    exit 1
fi

# 8. Проверяем логи
echo ""
echo "📌 Проверка подключения к GitHub..."
sleep 3

LOGS=$(sudo journalctl -u $SERVICE_NAME.service -n 20 --no-pager 2>/dev/null || true)

if echo "$LOGS" | grep -q "Connected to GitHub"; then
    echo "✓ Подключен к GitHub"
else
    echo "⚠ Подключение к GitHub неясно. Проверьте логи:"
    echo "$LOGS" | tail -n 10
fi

if echo "$LOGS" | grep -q "Listening for Jobs"; then
    echo "✓ Слушает задачи"
else
    echo "⚠ Слушание задач неясно. Проверьте логи:"
    echo "$LOGS" | tail -n 10
fi

echo ""
echo "=========================================================="
echo "✅ Установка завершена!"
echo ""
echo "Следующие шаги:"
echo "1. Проверьте, что раннер появился как Online в GitHub:"
echo "   https://github.com/agrotech-ric/petfood-platform/settings/actions/runners"
echo ""
echo "2. Запустите workflow вручную для теста:"
echo "   GitHub Actions → Deploy to local production (self-hosted) → Run workflow"
echo ""
echo "3. После успешного deploy изменения из main покажут на продакшене:"
echo "   http://10.1.10.144:5555"
echo ""
