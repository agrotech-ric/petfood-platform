#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 [--force-all] [--paths-file <file> | <base-commit> <head-commit>]" >&2
}

all_services=(
  auth-production
  account-production
  pets-production
  notifications-production
  recommender-production
  gateway-production
  frontend-production
)

java_services=(
  auth-production
  account-production
  pets-production
  notifications-production
  gateway-production
)

force_all=false
paths_file=

while [ "$#" -gt 0 ]; do
  case "$1" in
    --force-all)
      force_all=true
      shift
      ;;
    --paths-file)
      if [ "$#" -lt 2 ]; then
        usage
        exit 2
      fi
      paths_file=$2
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    --*)
      usage
      exit 2
      ;;
    *)
      break
      ;;
  esac
done

base_commit=${1:-}
head_commit=${2:-}

if [ -n "$paths_file" ] && [ "$#" -ne 0 ]; then
  usage
  exit 2
fi

if [ -z "$paths_file" ] && [ "$force_all" = false ] && [ "$#" -ne 2 ]; then
  usage
  exit 2
fi

declare -A selected=()
declare -A changed_paths=()
deploy_all=false
reason="selected-services"

select_all() {
  local service
  deploy_all=true
  for service in "${all_services[@]}"; do
    selected["$service"]=1
  done
}

select_java() {
  local service
  for service in "${java_services[@]}"; do
    selected["$service"]=1
  done
}

classify_path() {
  local path=$1

  changed_paths["$path"]=1

  case "$path" in
    frontend-next/*)
      selected[frontend-production]=1
      ;;
    nutrient-recommender-main/*)
      selected[recommender-production]=1
      ;;
    backend-main-sandbox/services/auth/*)
      selected[auth-production]=1
      ;;
    backend-main-sandbox/services/account/*)
      selected[account-production]=1
      ;;
    backend-main-sandbox/services/pets/*)
      selected[pets-production]=1
      ;;
    backend-main-sandbox/services/notifications/*)
      selected[notifications-production]=1
      ;;
    backend-main-sandbox/platform/gateway/*)
      selected[gateway-production]=1
      ;;
    backend-main-sandbox/build.gradle|backend-main-sandbox/settings.gradle|backend-main-sandbox/gradle.properties|backend-main-sandbox/gradlew|backend-main-sandbox/gradlew.bat|backend-main-sandbox/gradle/*|backend-main-sandbox/deployments/*|backend-main-sandbox/.dockerignore)
      select_java
      ;;
    docker-compose.production.yml|.env.production.example|scripts/validate-production-config.sh|scripts/select-production-services.sh|scripts/deploy-selected-production-services.sh|.github/workflows/deploy-main-selective.yml|.github/workflows/deploy-self-hosted.yml)
      select_all
      ;;
    docs/*|openspec/*|frontend-main/*|backend-main/*|.agents/*|.cursor/*|README.md|README_SANDBOX_BACKEND.md|CONTRIBUTING.md|AGENTS.md|CI_CD.md|LICENSE|.gitignore|.gitattributes|docker-compose.sandbox.yml|docker-compose.local.yml|docker-compose.maintenance.yml|docker-compose.yml|run-beta.sh|scripts/test-select-production-services.sh|scripts/production-rehearsal-smoke.sh|scripts/legacy-rollback-smoke.sh|scripts/security-boundary-smoke.sh)
      ;;
    *)
      select_all
      reason="unknown-path:$path"
      ;;
  esac
}

read_diff_paths() {
  local status old_path new_path diff_file parse_failed=false

  diff_file=$(mktemp)
  if ! git diff --name-status -z --find-renames "$base_commit" "$head_commit" > "$diff_file"; then
    rm -f -- "$diff_file"
    return 1
  fi

  while IFS= read -r -d '' status; do
    if ! IFS= read -r -d '' old_path; then
      parse_failed=true
      break
    fi
    case "$status" in
      R*|C*)
        if ! IFS= read -r -d '' new_path; then
          parse_failed=true
          break
        fi
        classify_path "$old_path"
        classify_path "$new_path"
        ;;
      *)
        classify_path "$old_path"
        ;;
    esac
  done < "$diff_file"

  rm -f -- "$diff_file"
  [ "$parse_failed" = false ]
}

if [ "$force_all" = true ]; then
  select_all
  reason="manual-force-all"
elif [ -n "$paths_file" ]; then
  if [ ! -f "$paths_file" ]; then
    select_all
    reason="paths-file-unavailable"
  else
    while IFS= read -r path || [ -n "$path" ]; do
      [ -z "$path" ] || classify_path "$path"
    done < "$paths_file"
  fi
else
  if [[ ! "$base_commit" =~ ^[0-9a-f]{40}$ ]] ||
     [[ ! "$head_commit" =~ ^[0-9a-f]{40}$ ]] ||
     [[ "$base_commit" =~ ^0{40}$ ]] ||
     ! git cat-file -e "$base_commit^{commit}" 2>/dev/null ||
     ! git cat-file -e "$head_commit^{commit}" 2>/dev/null; then
    select_all
    reason="comparison-unavailable"
  elif ! read_diff_paths; then
    select_all
    reason="comparison-failed"
  fi
fi

services=()
for service in "${all_services[@]}"; do
  if [ "${selected[$service]:-}" = 1 ]; then
    services+=("$service")
  fi
done

if [ "${#services[@]}" -eq 0 ]; then
  no_op=true
  reason="no-runtime-changes"
else
  no_op=false
fi

services_csv=$(IFS=,; echo "${services[*]}")
changed_path_count=${#changed_paths[@]}

emit_output() {
  local target=${GITHUB_OUTPUT:-}

  printf 'services=%s\n' "$services_csv"
  printf 'service_count=%s\n' "${#services[@]}"
  printf 'no_op=%s\n' "$no_op"
  printf 'deploy_all=%s\n' "$deploy_all"
  printf 'reason=%s\n' "$reason"
  printf 'changed_path_count=%s\n' "$changed_path_count"

  if [ -n "$target" ]; then
    {
      printf 'services=%s\n' "$services_csv"
      printf 'service_count=%s\n' "${#services[@]}"
      printf 'no_op=%s\n' "$no_op"
      printf 'deploy_all=%s\n' "$deploy_all"
      printf 'reason=%s\n' "$reason"
      printf 'changed_path_count=%s\n' "$changed_path_count"
    } >> "$target"
  fi
}

emit_output
