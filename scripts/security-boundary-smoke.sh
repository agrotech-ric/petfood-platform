#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"

base_url=${SECURITY_TEST_BASE_URL:-http://10.1.10.144:18190}
browser_origin=${SECURITY_TEST_ORIGIN:-http://10.1.10.144:5174}
email="security-e2e-$(date +%s)@example.test"
password='SecureTest9#'
work_dir=$(mktemp -d)
cookie_jar="$work_dir/cookies"
object_key=''

cleanup() {
    if [[ -s "$cookie_jar" ]]; then
        curl -sS -b "$cookie_jar" -X DELETE -H "Origin: $browser_origin" \
            "$base_url/api/v1/account" >/dev/null 2>&1 || true
    fi
    if [[ -n "$object_key" ]]; then
        docker compose -f docker-compose.sandbox.yml exec -T pets-service-sandbox \
            unlink "/data/pets-photos/$object_key" >/dev/null 2>&1 || true
    fi
    docker compose -f docker-compose.sandbox.yml exec -T redis-sandbox \
        redis-cli --scan --pattern "*${email}*" | while read -r key; do
        [[ -z "$key" ]] || docker compose -f docker-compose.sandbox.yml exec -T \
            redis-sandbox redis-cli DEL "$key" >/dev/null
    done
    find "$work_dir" -type f -delete
    rmdir "$work_dir"
}
trap cleanup EXIT

request_status() {
    local output=$1
    shift
    curl -sS -o "$output" -w '%{http_code}' -H "Origin: $browser_origin" "$@"
}

assert_status() {
    local expected=$1
    local actual=$2
    local label=$3
    if [[ "$actual" != "$expected" ]]; then
        printf '%s: expected HTTP %s, got %s\n' "$label" "$expected" "$actual" >&2
        exit 1
    fi
}

register_body=$(jq -nc --arg email "$email" --arg password "$password" \
    '{email:$email,firstName:"Security",lastName:"Test",password:$password}')
status=$(request_status "$work_dir/register.json" -H 'Content-Type: application/json' \
    -d "$register_body" "$base_url/api/v1/account/register")
assert_status 200 "$status" registration

otp=$(docker compose -f docker-compose.sandbox.yml exec -T redis-sandbox \
    redis-cli --raw GET "acc:confirm:$email")
[[ -n "$otp" ]]
confirm_body=$(jq -nc --arg email "$email" --arg code "$otp" '{email:$email,code:$code}')
status=$(request_status "$work_dir/confirm.json" -c "$cookie_jar" \
    -H 'Content-Type: application/json' -d "$confirm_body" \
    "$base_url/api/v1/account/register/confirm")
assert_status 200 "$status" registration-confirm
! grep -q 'sid' "$work_dir/confirm.json"

status=$(request_status /dev/null -b "$cookie_jar" -c "$cookie_jar" -X POST \
    "$base_url/api/v1/account/logout")
assert_status 200 "$status" logout
sleep 1

login_body=$(jq -nc --arg email "$email" --arg password "$password" \
    '{email:$email,password:$password}')
status=$(request_status "$work_dir/login.json" -b "$cookie_jar" -c "$cookie_jar" \
    -H 'Content-Type: application/json' -d "$login_body" \
    "$base_url/api/v1/account/login/email")
assert_status 200 "$status" login
! grep -q 'sid' "$work_dir/login.json"

status=$(request_status "$work_dir/profile.json" -b "$cookie_jar" \
    -H 'Authorization: Bearer CANARY_CALLER_JWT' \
    "$base_url/api/v1/account/profile/me")
assert_status 200 "$status" authorization-precedence
[[ "$(jq -r .email "$work_dir/profile.json")" == "$email" ]]
status=$(request_status /dev/null -b "$cookie_jar" \
    "$base_url/petfood/api/v1/account/profile/me")
assert_status 200 "$status" prefixed-api

status=$(request_status "$work_dir/upload-url.json" -b "$cookie_jar" \
    -H 'Content-Type: application/json' \
    -d '{"fileName":"../../canary.png","contentType":"image/png"}' \
    "$base_url/api/v1/pets/photos/upload-url")
assert_status 200 "$status" photo-upload-url
object_key=$(jq -r .objectKey "$work_dir/upload-url.json")
[[ "$object_key" == pets/*/*.png ]]
upload_url=$(jq -r .url "$work_dir/upload-url.json")
printf '\x89PNG\r\n\x1a\nCANARY' > "$work_dir/photo.png"
status=$(request_status /dev/null -b "$cookie_jar" -X PUT -H 'Content-Type: image/png' \
    --data-binary @"$work_dir/photo.png" "$base_url$upload_url")
assert_status 200 "$status" photo-upload

encoded_key=$(printf '%s' "$object_key" | jq -sRr @uri)
status=$(request_status "$work_dir/download-url.json" -b "$cookie_jar" \
    "$base_url/api/v1/pets/photos/download-url?objectKey=$encoded_key")
assert_status 200 "$status" photo-download-url
download_url=$(jq -r .url "$work_dir/download-url.json")
status=$(curl -sS -D "$work_dir/photo.headers" -o "$work_dir/downloaded.png" \
    -w '%{http_code}' -b "$cookie_jar" -H "Origin: $browser_origin" \
    "$base_url$download_url")
assert_status 200 "$status" photo-download
cmp "$work_dir/photo.png" "$work_dir/downloaded.png"
grep -qi '^Cache-Control: private, no-store' "$work_dir/photo.headers"

status=$(request_status /dev/null -b "$cookie_jar" "$base_url/recommender/")
assert_status 200 "$status" recommender
status=$(request_status /dev/null -b "$cookie_jar" "$base_url/petfood/recommender/")
assert_status 200 "$status" prefixed-recommender
status=$(request_status /dev/null "$base_url/recommender/")
assert_status 401 "$status" unauthenticated-recommender

sleep 2
reset_body=$(jq -nc --arg email "$email" '{email:$email}')
status=$(request_status /dev/null -H 'Content-Type: application/json' -d "$reset_body" \
    "$base_url/api/v1/account/password/reset/start")
assert_status 200 "$status" otp-request
status=$(request_status /dev/null -H 'Content-Type: application/json' -d "$reset_body" \
    "$base_url/api/v1/account/password/reset/start")
assert_status 429 "$status" otp-throttle

for port in 18181 18182 18183 18184 18001; do
    if curl -fsS --max-time 1 "http://127.0.0.1:$port/actuator/health" >/dev/null 2>&1; then
        printf 'internal port %s is reachable\n' "$port" >&2
        exit 1
    fi
done

status=$(request_status /dev/null -b "$cookie_jar" -c "$cookie_jar" -X DELETE \
    "$base_url/api/v1/account")
assert_status 200 "$status" account-cleanup
: > "$cookie_jar"

echo "Security boundary smoke test passed"
