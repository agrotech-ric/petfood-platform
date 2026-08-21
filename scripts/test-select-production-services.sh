#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
classifier="$script_dir/select-production-services.sh"
test_dir=$(mktemp -d)
trap 'rm -rf -- "$test_dir"' EXIT

assert_case() {
  local name=$1
  local expected_services=$2
  local expected_no_op=$3
  local expected_deploy_all=$4
  shift 4

  local paths_file="$test_dir/$name.paths"
  : > "$paths_file"
  printf '%s\n' "$@" > "$paths_file"

  local output
  output=$(bash "$classifier" --paths-file "$paths_file")

  grep -Fxq "services=$expected_services" <<< "$output"
  grep -Fxq "no_op=$expected_no_op" <<< "$output"
  grep -Fxq "deploy_all=$expected_deploy_all" <<< "$output"
  echo "PASS: $name"
}

assert_case frontend "frontend-production" false false \
  frontend-next/src/App.tsx
assert_case recommender "recommender-production" false false \
  nutrient-recommender-main/app/main.py
assert_case auth "auth-production" false false \
  backend-main-sandbox/services/auth/src/Auth.java
assert_case account "account-production" false false \
  backend-main-sandbox/services/account/src/Account.java
assert_case pets "pets-production" false false \
  backend-main-sandbox/services/pets/src/Pet.java
assert_case notifications "notifications-production" false false \
  backend-main-sandbox/services/notifications/src/Notification.java
assert_case gateway "gateway-production" false false \
  backend-main-sandbox/platform/gateway/src/Gateway.java
assert_case multiple "pets-production,recommender-production,frontend-production" false false \
  frontend-next/src/App.tsx \
  nutrient-recommender-main/app/main.py \
  backend-main-sandbox/services/pets/src/Pet.java
assert_case shared-java "auth-production,account-production,pets-production,notifications-production,gateway-production" false false \
  backend-main-sandbox/settings.gradle
assert_case production-wide "auth-production,account-production,pets-production,notifications-production,recommender-production,gateway-production,frontend-production" false true \
  docker-compose.production.yml
assert_case docs-only "" true false \
  README.md \
  docs/operations/production-deployment.md \
  openspec/changes/example/proposal.md
assert_case legacy-only "" true false \
  frontend-main/src/App.jsx \
  backend-main/services/pets/Legacy.java
assert_case rename-across-services "pets-production,frontend-production" false false \
  frontend-next/src/Old.tsx \
  backend-main-sandbox/services/pets/src/New.java
assert_case unknown "auth-production,account-production,pets-production,notifications-production,recommender-production,gateway-production,frontend-production" false true \
  new-runtime/service.yaml

unavailable_output=$(bash "$classifier" 0000000000000000000000000000000000000000 1111111111111111111111111111111111111111)
grep -Fxq 'deploy_all=true' <<< "$unavailable_output"
grep -Fxq 'reason=comparison-unavailable' <<< "$unavailable_output"
echo "PASS: comparison-unavailable"

forced_output=$(bash "$classifier" --force-all)
grep -Fxq 'deploy_all=true' <<< "$forced_output"
grep -Fxq 'reason=manual-force-all' <<< "$forced_output"
echo "PASS: manual-force-all"

github_output="$test_dir/github-output"
GITHUB_OUTPUT="$github_output" bash "$classifier" --force-all >/dev/null
grep -Fxq 'services=auth-production,account-production,pets-production,notifications-production,recommender-production,gateway-production,frontend-production' "$github_output"
grep -Fxq 'no_op=false' "$github_output"
echo "PASS: github-output"

rename_repo="$test_dir/rename-repository"
mkdir -p "$rename_repo/frontend-next/src"
git -C "$rename_repo" init --quiet
printf 'export const value = 1;\n' > "$rename_repo/frontend-next/src/Old.tsx"
git -C "$rename_repo" add frontend-next/src/Old.tsx
GIT_AUTHOR_NAME=Test GIT_AUTHOR_EMAIL=test@example.test \
GIT_COMMITTER_NAME=Test GIT_COMMITTER_EMAIL=test@example.test \
  git -C "$rename_repo" commit --quiet -m initial
rename_base=$(git -C "$rename_repo" rev-parse HEAD)
mkdir -p "$rename_repo/backend-main-sandbox/services/pets/src"
git -C "$rename_repo" mv frontend-next/src/Old.tsx backend-main-sandbox/services/pets/src/New.java
GIT_AUTHOR_NAME=Test GIT_AUTHOR_EMAIL=test@example.test \
GIT_COMMITTER_NAME=Test GIT_COMMITTER_EMAIL=test@example.test \
  git -C "$rename_repo" commit --quiet -m rename
rename_head=$(git -C "$rename_repo" rev-parse HEAD)
rename_output=$(cd "$rename_repo" && bash "$classifier" "$rename_base" "$rename_head")
grep -Fxq 'services=pets-production,frontend-production' <<< "$rename_output"
grep -Fxq 'changed_path_count=2' <<< "$rename_output"
echo "PASS: git-rename-old-and-new-paths"

echo "All production service classification tests passed"
