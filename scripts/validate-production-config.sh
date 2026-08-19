#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <production-env-file> <full-release-commit> [--require-volumes]" >&2
}

if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then
  usage
  exit 2
fi

production_env_input=$1
release_commit=$2
volume_check=${3:-}

if [ -n "$volume_check" ] && [ "$volume_check" != --require-volumes ]; then
  usage
  exit 2
fi

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
repo_dir=$(cd "$script_dir/.." && pwd)
production_env_file=$(readlink -f -- "$production_env_input")

test -n "${repo_dir:?}"
test -n "${production_env_file:?}"
test -f "$production_env_file"
test ! -L "$production_env_input"

case "$production_env_file" in
  "$repo_dir"/*)
    echo "Production environment file must be outside the repository" >&2
    exit 1
    ;;
esac

env_mode=$(stat -c '%a' "$production_env_file")
test -n "${env_mode:?}"
if (( (8#$env_mode & 077) != 0 )); then
  echo "Production environment file must not be accessible by group or others" >&2
  exit 1
fi

if [[ ! "$release_commit" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Release commit must be a full lowercase Git SHA" >&2
  exit 1
fi

if grep -Eq '(^|=)(replace-with|your_)' "$production_env_file"; then
  echo "Production environment file still contains example placeholders" >&2
  exit 1
fi

compose_file="$repo_dir/docker-compose.production.yml"
routes_file="$repo_dir/backend-main-sandbox/platform/gateway/src/main/resources/application-routes.yml"
test -f "$compose_file"
test -f "$routes_file"

compose_command=(docker compose --env-file "$production_env_file" -f "$compose_file")
PETFOOD_RELEASE_ID="$release_commit" "${compose_command[@]}" config --quiet
rendered_config=$(PETFOOD_RELEASE_ID="$release_commit" "${compose_command[@]}" config --format json)
test -n "${rendered_config:?}"

jq -e --arg release "$release_commit" '
  ([.services[] | (.ports // []) | length] | add) == 1 and
  (.services["frontend-production"].ports[0].host_ip == "127.0.0.1") and
  ([.services[] | .volumes[]? | select(.type == "bind")] | length) == 0 and
  ([.services[] | .environment.SPRING_PROFILES_ACTIVE? | select(. != null)] | all(. == "prod")) and
  (.networks.application.internal == true) and
  (.services["account-production"].environment.SESSION_COOKIE_SECURE == "true") and
  (.services["account-production"].environment.SESSION_COOKIE_PATH == "/petfood") and
  (.services["gateway-production"].environment.PUBLIC_PATH_PREFIX == "/petfood") and
  (.services["gateway-production"].environment.CORS_ALLOWED_ORIGIN | test("^https://[^/]+$")) and
  (.services["gateway-production"].environment.TRUSTED_PROXY_ADDRESSES | length > 0) and
  (.services["auth-production"].environment.DB_NAME == .services["account-production"].environment.DB_NAME) and
  (.services["account-production"].environment.DB_NAME == .services["pets-production"].environment.DB_NAME) and
  (.services["account-production"].environment.REDIS_HOST == "redis-production") and
  (.services["gateway-production"].environment.REDIS_HOST == "redis-production") and
  (.services["account-production"].environment.RABBITMQ_HOST == "rabbitmq-production") and
  (.services["pets-production"].environment.RABBITMQ_HOST == "rabbitmq-production") and
  (.services["notifications-production"].environment.RABBITMQ_HOST == "rabbitmq-production") and
  (.services["pets-production"].environment.PETS_MINIO_ENDPOINT == "http://minio-production:9000") and
  (.services["pets-production"].environment.PETS_PHOTO_STORAGE_TYPE == "fs") and
  (.services["pets-production"].environment.PETS_PHOTO_STORAGE_BASE_URL | test("^https://.+/petfood$")) and
  (.services["notifications-production"].environment.SMTP_HOST | length > 0) and
  (.services["notifications-production"].environment.SMTP_GMAIL_USER | length > 0) and
  (.services["notifications-production"].environment.SMTP_GMAIL_PASS | length > 0) and
  (.services["notifications-production"].environment.SMTP_GMAIL_FROM | length > 0) and
  (.services["auth-production"].image == ("petfood/auth:" + $release)) and
  (.services["account-production"].image == ("petfood/account:" + $release)) and
  (.services["pets-production"].image == ("petfood/pets:" + $release)) and
  (.services["gateway-production"].image == ("petfood/gateway:" + $release)) and
  (.services["recommender-production"].image == ("petfood/recommender:" + $release)) and
  (.services["notifications-production"].image == ("petfood/notifications:" + $release)) and
  (.services["frontend-production"].image == ("petfood/frontend:" + $release)) and
  ([.volumes[] | select(.external == true)] | length) == 5 and
  ([.volumes[].name] | unique | length) == 5 and
  ([.volumes[].name | select(startswith("petfood_platforma_"))] | length) == 0
' <<<"$rendered_config" >/dev/null

grep -Fq 'Path=/petfood/api/v1/account/' "$routes_file"
grep -Fq 'Path=/petfood/api/v1/pets/' "$routes_file"
grep -Fq 'Path=/petfood/recommender/**' "$routes_file"

if grep -nE '\$\{(POSTGRES_PASSWORD|RABBITMQ_PASSWORD|MINIO_ROOT_PASSWORD|RATE_LIMIT_PEPPER|SMTP_GMAIL_PASS)(:-|-[^?])' "$compose_file"; then
  echo "A production secret has a usable fallback" >&2
  exit 1
fi

if git -C "$repo_dir" ls-files | grep -E '(^|/)\.env($|\.)' | grep -vE '(^|/)\.env(\.production)?\.example$'; then
  echo "A non-example environment file is tracked by Git" >&2
  exit 1
fi

if [ "$volume_check" = --require-volumes ]; then
  mapfile -t durable_volumes < <(jq -r '.volumes[] | select(.external == true) | .name' <<<"$rendered_config")
  test "${#durable_volumes[@]}" -eq 5
  for volume_name in "${durable_volumes[@]}"; do
    test -n "${volume_name:?}"
    docker volume inspect "$volume_name" >/dev/null
  done
fi

echo "Production configuration validation passed"
