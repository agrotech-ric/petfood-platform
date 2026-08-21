#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  echo "Usage: $0 <production-env-file> <release-commit> <comma-separated-services> <rollback-id>" >&2
}

if [ "$#" -ne 4 ]; then
  usage
  exit 2
fi

production_env_input=$1
release_commit=$2
services_csv=$3
rollback_id=$4

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
repo_dir=$(cd "$script_dir/.." && pwd)
production_env_file=$(readlink -f -- "$production_env_input")
state_file=$(mktemp)
trap 'rm -f -- "$state_file"' EXIT

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

if [[ ! "$release_commit" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Release commit must be a full lowercase Git SHA" >&2
  exit 1
fi

if [[ ! "$rollback_id" =~ ^[A-Za-z0-9_.-]+$ ]]; then
  echo "Rollback identifier contains unsupported characters" >&2
  exit 1
fi

declare -A image_repositories=(
  [auth-production]=petfood/auth
  [account-production]=petfood/account
  [pets-production]=petfood/pets
  [notifications-production]=petfood/notifications
  [recommender-production]=petfood/recommender
  [gateway-production]=petfood/gateway
  [frontend-production]=petfood/frontend
)

deployment_order=(
  auth-production
  account-production
  pets-production
  notifications-production
  recommender-production
  gateway-production
  frontend-production
)

declare -A requested=()
IFS=',' read -r -a input_services <<< "$services_csv"
for service in "${input_services[@]}"; do
  if [ -z "$service" ] || [ -z "${image_repositories[$service]:-}" ]; then
    echo "Unsupported production service: ${service:-<empty>}" >&2
    exit 1
  fi
  requested["$service"]=1
done

selected_services=()
for service in "${deployment_order[@]}"; do
  if [ "${requested[$service]:-}" = 1 ]; then
    selected_services+=("$service")
  fi
done

if [ "${#selected_services[@]}" -eq 0 ]; then
  echo "At least one production service must be selected" >&2
  exit 1
fi

compose=(docker compose --env-file "$production_env_file" -f "$repo_dir/docker-compose.production.yml")
rollback_tag="rollback-$rollback_id"
deployment_started=false
rollback_outcome=not-needed

append_summary() {
  local message=$1
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    printf '%s\n' "$message" >> "$GITHUB_STEP_SUMMARY"
  fi
}

remove_rollback_tags() {
  local service image_id rollback_image
  while IFS=$'\t' read -r service image_id rollback_image; do
    [ -z "$rollback_image" ] || docker image rm "$rollback_image" >/dev/null 2>&1 || true
  done < "$state_file"
}

wait_for_container() {
  local service=$1
  local release_id=$2
  local attempts=60
  local stable_running=0
  local container_id status health

  while [ "$attempts" -gt 0 ]; do
    container_id=$(PETFOOD_RELEASE_ID="$release_id" "${compose[@]}" ps -q "$service")
    if [ -n "$container_id" ]; then
      status=$(docker inspect --format '{{.State.Status}}' "$container_id")
      health=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_id")
      if [ "$status" = running ] && [ "$health" = healthy ]; then
        return 0
      fi
      if [ "$status" = running ] && [ "$health" = none ]; then
        stable_running=$((stable_running + 1))
        if [ "$stable_running" -ge 5 ]; then
          return 0
        fi
      else
        stable_running=0
      fi
      if [ "$status" = exited ] || [ "$status" = dead ]; then
        return 1
      fi
    fi
    attempts=$((attempts - 1))
    sleep 2
  done

  return 1
}

verify_internal_service() {
  local service=$1
  local release_id=$2

  case "$service" in
    auth-production)
      PETFOOD_RELEASE_ID="$release_id" "${compose[@]}" exec -T frontend-production sh -c 'nc -z -w 5 auth-production 8082'
      ;;
    account-production)
      PETFOOD_RELEASE_ID="$release_id" "${compose[@]}" exec -T frontend-production sh -c 'nc -z -w 5 account-production 8081'
      ;;
    pets-production)
      PETFOOD_RELEASE_ID="$release_id" "${compose[@]}" exec -T frontend-production wget -q -O /dev/null http://pets-production:8083/actuator/health
      ;;
    notifications-production)
      # Notifications is a message consumer without an HTTP listener. Its
      # stable running state is verified by wait_for_container.
      return 0
      ;;
    recommender-production)
      PETFOOD_RELEASE_ID="$release_id" "${compose[@]}" exec -T frontend-production wget -q -O /dev/null http://recommender-production:8000/
      ;;
    gateway-production)
      PETFOOD_RELEASE_ID="$release_id" "${compose[@]}" exec -T frontend-production wget -q -O /dev/null http://gateway-production:8090/actuator/health
      ;;
    frontend-production)
      PETFOOD_RELEASE_ID="$release_id" "${compose[@]}" exec -T frontend-production wget -q -O /dev/null http://127.0.0.1/healthz
      ;;
  esac
}

wait_for_internal_service() {
  local service=$1
  local release_id=$2
  local attempts=60

  while [ "$attempts" -gt 0 ]; do
    if verify_internal_service "$service" "$release_id" >/dev/null 2>&1; then
      return 0
    fi
    attempts=$((attempts - 1))
    sleep 2
  done

  echo "Internal readiness check timed out for $service" >&2
  return 1
}

verify_release() {
  local release_id=$1
  local service public_url http_status

  for service in "${selected_services[@]}"; do
    if ! wait_for_container "$service" "$release_id"; then
      echo "Container readiness check timed out for $service" >&2
      return 1
    fi
    if ! wait_for_internal_service "$service" "$release_id"; then
      return 1
    fi
  done

  public_url=$(PETFOOD_RELEASE_ID="$release_id" "${compose[@]}" config --format json |
    jq -r '.services["pets-production"].environment.PETS_PHOTO_STORAGE_BASE_URL')
  if [[ ! "$public_url" =~ ^https://[^/]+/petfood$ ]]; then
    echo "Configured public URL does not have the expected production shape" >&2
    return 1
  fi

  if ! curl --fail --silent --show-error --max-time 20 "$public_url/" >/dev/null; then
    echo "Public application route failed readiness verification" >&2
    return 1
  fi

  if [ "${requested[recommender-production]:-}" = 1 ] || [ "${requested[gateway-production]:-}" = 1 ]; then
    http_status=$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 30 "$public_url/recommender/")
    case "$http_status" in
      200|401|403) ;;
      *)
        echo "Public recommender route returned unexpected HTTP status: $http_status" >&2
        return 1
        ;;
    esac
  fi

  if [ "${requested[auth-production]:-}" = 1 ] ||
     [ "${requested[account-production]:-}" = 1 ] ||
     [ "${requested[pets-production]:-}" = 1 ] ||
     [ "${requested[gateway-production]:-}" = 1 ]; then
    http_status=$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 20 "$public_url/api/v1/pets")
    case "$http_status" in
      401|403) ;;
      *)
        echo "Protected public route returned unexpected HTTP status: $http_status" >&2
        return 1
        ;;
    esac
  fi
}

rollback_release() {
  local service
  rollback_outcome=failed
  append_summary "- Rollback: started with preserved tag \`$rollback_tag\`"

  for service in "${selected_services[@]}"; do
    PETFOOD_RELEASE_ID="$rollback_tag" "${compose[@]}" up -d --no-deps --no-build "$service" || return 1
  done

  verify_release "$rollback_tag" || return 1
  rollback_outcome=succeeded
  append_summary "- Rollback: succeeded for selected services"
}

handle_error() {
  local exit_code=$1
  trap - ERR
  set +e

  if [ "$deployment_started" = true ]; then
    rollback_release
    if [ "$rollback_outcome" != succeeded ]; then
      append_summary "- Rollback: incomplete; use the guarded manual recovery procedure"
      echo "Automatic rollback was incomplete; persistent state may require manual recovery" >&2
    fi
  else
    remove_rollback_tags
    append_summary "- Rollback: not required because production rollout had not started"
  fi

  exit "$exit_code"
}
trap 'handle_error $?' ERR

cd "$repo_dir"
bash scripts/validate-production-config.sh "$production_env_file" "$release_commit" --require-volumes

for service in "${selected_services[@]}"; do
  container_id=$(PETFOOD_RELEASE_ID="$release_commit" "${compose[@]}" ps -q "$service")
  if [ -z "$container_id" ]; then
    echo "Selected service is not currently running: $service" >&2
    exit 1
  fi

  container_status=$(docker inspect --format '{{.State.Status}}' "$container_id")
  if [ "$container_status" != running ]; then
    echo "Selected service is not running: $service" >&2
    exit 1
  fi

  image_id=$(docker inspect --format '{{.Image}}' "$container_id")
  test -n "${image_id:?}"
  image_repository=${image_repositories[$service]}
  docker image inspect "$image_id" >/dev/null
  docker tag "$image_id" "$image_repository:$rollback_tag"
  printf '%s\t%s\t%s\n' "$service" "$image_id" "$image_repository:$rollback_tag" >> "$state_file"
done

append_summary "- Selected services: \`${services_csv}\`"
append_summary "- Target image tag: \`$release_commit\`"
append_summary "- Previous selected images were preserved locally as \`$rollback_tag\`"

deployment_started=true
for service in "${selected_services[@]}"; do
  PETFOOD_RELEASE_ID="$release_commit" "${compose[@]}" up -d --no-deps --no-build "$service"
done

verify_release "$release_commit"
deployment_started=false

while IFS=$'\t' read -r service image_id rollback_image; do
  append_summary "- $service: \`${image_repositories[$service]}:$release_commit\` (previous image \`$image_id\`)"
done < "$state_file"
remove_rollback_tags

append_summary "- Readiness and public routing verification: passed"
echo "Selective production deployment completed successfully"
