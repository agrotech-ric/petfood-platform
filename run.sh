#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/home/iot/PetFood/petfood_platforma"
SERVER_IP="10.1.10.144"
SERVER_PORT="5555"

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

check_environment() {
    print_header "Проверка окружения"

    if ! command -v docker &> /dev/null; then
        print_error "Docker не установлен"
        exit 1
    fi
    print_success "Docker установлен: $(docker --version)"

    if ! docker ps &> /dev/null; then
        print_error "Docker daemon не запущен"
        exit 1
    fi
    print_success "Docker daemon запущен"

    if [ ! -f "$PROJECT_DIR/.env" ]; then
        print_error "Файл .env не найден"
        exit 1
    fi
    print_success "Файл .env найден"
}

start_services() {
    print_header "Запуск сервисов (это может занять 10-15 минут)"

    cd "$PROJECT_DIR"

    # Сборка и запуск
    if docker compose up --build -d; then
        print_success "Сервисы успешно запущены!"
    else
        print_error "Ошибка при запуске сервисов"
        exit 1
    fi
}

stop_services() {
    print_header "Остановка сервисов"

    cd "$PROJECT_DIR"
    if docker compose down; then
        print_success "Сервисы остановлены"
    else
        print_error "Ошибка при остановке сервисов"
    fi
}

status_services() {
    print_header "Статус сервисов"
    cd "$PROJECT_DIR"
    docker compose ps
}

check_health() {
    print_header "Проверка здоровья сервисов"

    # Подождём немного, чтобы сервисы запустились
    echo "Ожидание запуска сервисов..."
    sleep 5

    local services=(
        "localhost:5555|Main (Frontend)"
        "localhost:8090|Gateway API"
        "localhost:8082|Auth Service"
        "localhost:8081|Account Service"
        "localhost:8083|Pets Service"
        "localhost:8000|Recommender API"
        "localhost:9001|MinIO Console"
        "localhost:15672|RabbitMQ Management"
    )

    for service in "${services[@]}"; do
        IFS='|' read -r port name <<< "$service"

        if curl -s -o /dev/null -w "%{http_code}" "http://$port" | grep -q -E "200|301|302|401"; then
            print_success "$name доступен ($port)"
        else
            print_warning "$name может быть не готов ($port)"
        fi
    done
}

show_info() {
    print_header "Информация о сервисах"

    cat << EOF
${GREEN}Приложение доступно по адресу:${NC}
  🌐 Frontend:        http://$SERVER_IP:$SERVER_PORT
  📡 API Gateway:     http://$SERVER_IP:$SERVER_PORT/api/
  🤖 Recommender:     http://$SERVER_IP:$SERVER_PORT/recommender/
  💾 MinIO Console:   http://$SERVER_IP:$SERVER_PORT/minio-console/
  📨 RabbitMQ:        http://$SERVER_IP:$SERVER_PORT/rabbitmq/

${GREEN}Сервисы в локальной сети:${NC}
  Database:       postgres:5432 (user: postgres, pass: postgres123)
  Redis:          redis:6379
  RabbitMQ API:   rabbitmq:5672
  MinIO S3 API:   minio:9000

${GREEN}Учетные данные:${NC}
  MinIO:          minioadmin / minioadmin
  RabbitMQ:       guest / guest
  PostgreSQL:     postgres / postgres123

${GREEN}Логи и управление:${NC}
  docker compose ps                    # Статус всех контейнеров
  docker compose logs -f               # Все логи (streaming)
  docker compose logs -f gateway-service # Логи конкретного сервиса
  docker compose down                  # Остановить всё
  docker compose down -v               # Остановить и удалить данные
EOF
}

view_logs() {
    print_header "Логи сервисов"
    cd "$PROJECT_DIR"
    docker compose logs -f "$1"
}

case "${1:-start}" in
    start)
        check_environment
        start_services
        sleep 3
        status_services
        sleep 5
        check_health
        show_info
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 2
        start_services
        sleep 3
        status_services
        ;;
    status)
        status_services
        ;;
    health)
        check_health
        ;;
    info)
        show_info
        ;;
    logs)
        view_logs "${2:-}"
        ;;
    *)
        echo "Использование: $0 {start|stop|restart|status|health|info|logs [service]}"
        echo ""
        echo "Примеры:"
        echo "  $0 start                  # Запустить всё"
        echo "  $0 stop                   # Остановить всё"
        echo "  $0 restart                # Перезапустить"
        echo "  $0 status                 # Показать статус"
        echo "  $0 health                 # Проверить здоровье сервисов"
        echo "  $0 logs gateway-service   # Логи gateway"
        echo "  $0 info                   # Показать информацию"
        exit 1
        ;;
esac
