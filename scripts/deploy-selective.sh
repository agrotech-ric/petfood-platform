#!/usr/bin/env bash
# Selective Docker Compose deploy: rebuild only services affected by changed files.
#
# Usage:
#   ./scripts/deploy-selective.sh              # git pull + selective deploy
#   FULL_DEPLOY=1 ./scripts/deploy-selective.sh
#   SKIP_GIT=1 OLD_COMMIT=abc123 ./scripts/deploy-selective.sh

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/home/iot/PetFood/petfood_platforma}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
FULL_DEPLOY="${FULL_DEPLOY:-0}"
SKIP_GIT="${SKIP_GIT:-0}"

ALL_BUILD_SERVICES=(
  auth-service
  account-service
  pets-service
  notifications-service
  gateway-service
  recommender-api
  frontend
)

cd "$PROJECT_DIR"

log() {
  echo "[deploy] $*"
}

mark_service() {
  SERVICES_TO_BUILD["$1"]=1
}

mark_all_backend() {
  for service in auth-service account-service pets-service notifications-service gateway-service; do
    mark_service "$service"
  done
}

declare -A SERVICES_TO_BUILD=()
COMPOSE_CHANGED=0
NGINX_CHANGED=0
DEPLOY_NEEDED=0

if [[ "$SKIP_GIT" != "1" ]]; then
  OLD_COMMIT="$(git rev-parse HEAD)"
  log "Fetching origin/main (current: ${OLD_COMMIT:0:8})"
  git fetch origin main
  git reset --hard origin/main
  NEW_COMMIT="$(git rev-parse HEAD)"
else
  OLD_COMMIT="${OLD_COMMIT:-}"
  NEW_COMMIT="$(git rev-parse HEAD)"
fi

if [[ "$FULL_DEPLOY" == "1" ]]; then
  log "FULL_DEPLOY=1 — rebuilding all application services"
  for service in "${ALL_BUILD_SERVICES[@]}"; do
    mark_service "$service"
  done
  DEPLOY_NEEDED=1
elif [[ -z "$OLD_COMMIT" ]] || [[ "$OLD_COMMIT" == "$NEW_COMMIT" ]]; then
  log "No new commits (${NEW_COMMIT:0:8}). Nothing to deploy."
  exit 0
else
  log "Changes between ${OLD_COMMIT:0:8}..${NEW_COMMIT:0:8}:"
  CHANGED_FILES="$(git diff --name-only "$OLD_COMMIT" "$NEW_COMMIT")"

  if [[ -z "$CHANGED_FILES" ]]; then
    log "Empty diff. Nothing to deploy."
    exit 0
  fi

  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    log "  - $file"

    case "$file" in
      frontend-main/*)
        mark_service frontend
        DEPLOY_NEEDED=1
        ;;
      nutrient-recommender-main/*)
        mark_service recommender-api
        DEPLOY_NEEDED=1
        ;;
      backend-main/services/auth/*)
        mark_service auth-service
        DEPLOY_NEEDED=1
        ;;
      backend-main/services/account/*)
        mark_service account-service
        DEPLOY_NEEDED=1
        ;;
      backend-main/services/pets/*)
        mark_service pets-service
        DEPLOY_NEEDED=1
        ;;
      backend-main/services/notifications/*)
        mark_service notifications-service
        DEPLOY_NEEDED=1
        ;;
      backend-main/platform/gateway/*)
        mark_service gateway-service
        DEPLOY_NEEDED=1
        ;;
      backend-main/build.gradle|backend-main/settings.gradle|backend-main/gradle/*|backend-main/gradlew|backend-main/gradlew.bat)
        mark_all_backend
        DEPLOY_NEEDED=1
        ;;
      backend-main/*)
        mark_all_backend
        DEPLOY_NEEDED=1
        ;;
      nginx.conf)
        NGINX_CHANGED=1
        DEPLOY_NEEDED=1
        ;;
      docker-compose.yml|docker-compose.local.yml|.env.example)
        COMPOSE_CHANGED=1
        DEPLOY_NEEDED=1
        ;;
      .github/*|*.md|run.sh|webhook_server.py|webhook_setup.sh|scripts/deploy-selective.sh|AGENTS.md|CI_CD.md)
        ;;
      *)
        log "  (ignored path: $file)"
        ;;
    esac
  done <<< "$CHANGED_FILES"
fi

if [[ "$DEPLOY_NEEDED" -eq 0 ]]; then
  log "Only docs/CI files changed. Containers were not restarted."
  exit 0
fi

if [[ ${#SERVICES_TO_BUILD[@]} -gt 0 ]]; then
  mapfile -t SERVICES_SORTED < <(printf '%s\n' "${!SERVICES_TO_BUILD[@]}" | sort)
  log "Rebuilding services: ${SERVICES_SORTED[*]}"

  for service in "${SERVICES_SORTED[@]}"; do
    log "Building and restarting: $service"
    docker compose -f "$COMPOSE_FILE" up -d --build --no-deps "$service"
  done
else
  log "No image rebuild required."
fi

if [[ "$NGINX_CHANGED" -eq 1 ]]; then
  log "Reloading nginx (config changed)"
  docker compose -f "$COMPOSE_FILE" up -d --no-deps nginx
fi

if [[ "$COMPOSE_CHANGED" -eq 1 ]]; then
  log "Applying docker-compose changes"
  docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
fi

log "Deployment finished."
docker compose -f "$COMPOSE_FILE" ps
