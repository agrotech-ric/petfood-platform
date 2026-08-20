#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"

base_url=${REHEARSAL_BASE_URL:-http://127.0.0.1:18082}
browser_origin=${REHEARSAL_ORIGIN:-https://rehearsal.invalid}
compose_project=${REHEARSAL_COMPOSE_PROJECT:-petfood_rehearsal}
compose_file=${REHEARSAL_COMPOSE_FILE:-docker-compose.production.yml}
env_file=${REHEARSAL_ENV_FILE:?REHEARSAL_ENV_FILE is required}
mailhog_container=${REHEARSAL_MAILHOG_CONTAINER:-petfood-rehearsal-mailhog}

case "$base_url" in
    http://127.0.0.1:*|http://localhost:*) ;;
    *)
        printf 'Refusing to run destructive rehearsal canaries against non-loopback URL: %s\n' "$base_url" >&2
        exit 1
        ;;
esac

[[ -f "$env_file" ]] || { printf 'Environment file not found: %s\n' "$env_file" >&2; exit 1; }
command -v curl >/dev/null
command -v jq >/dev/null
command -v docker >/dev/null

run_id="$(date -u +%Y%m%d%H%M%S)-$$"
owner_email="rehearsal-owner-${run_id}@example.test"
other_email="rehearsal-other-${run_id}@example.test"
password='Rehearsal9#Pass'
work_dir=$(mktemp -d)
owner_cookies="$work_dir/owner.cookies"
other_cookies="$work_dir/other.cookies"
object_key=''

compose() {
    docker compose -p "$compose_project" --env-file "$env_file" -f "$compose_file" "$@"
}

cleanup_account() {
    local cookie_jar=$1
    if [[ -s "$cookie_jar" ]]; then
        curl -sS -b "$cookie_jar" -X DELETE -H "Origin: $browser_origin" \
            "$base_url/petfood/api/v1/account" >/dev/null 2>&1 || true
    fi
}

cleanup_redis_identity() {
    local email=$1
    compose exec -T redis-production redis-cli --scan --pattern "*${email}*" | while read -r key; do
        [[ -z "$key" ]] || compose exec -T redis-production redis-cli DEL "$key" >/dev/null
    done
}

cleanup() {
    cleanup_account "$other_cookies"
    cleanup_account "$owner_cookies"
    if [[ -n "$object_key" ]]; then
        compose exec -T pets-production unlink "/data/pets-photos/$object_key" >/dev/null 2>&1 || true
    fi
    cleanup_redis_identity "$owner_email" || true
    cleanup_redis_identity "$other_email" || true
    case "$work_dir" in
        /tmp/tmp.*)
            find "$work_dir" -xdev -type f -delete
            rmdir "$work_dir"
            ;;
        *) printf 'Unexpected temporary directory, leaving it untouched: %s\n' "$work_dir" >&2 ;;
    esac
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
    printf 'PASS %-36s HTTP %s\n' "$label" "$actual"
}

register_and_confirm() {
    local email=$1
    local cookie_jar=$2
    local prefix=$3
    local body otp confirm_body status

    body=$(jq -nc --arg email "$email" --arg password "$password" \
        '{email:$email,firstName:"Rehearsal",lastName:"Canary",password:$password}')
    status=$(request_status "$work_dir/${prefix}-register.json" -H 'Content-Type: application/json' \
        -d "$body" "$base_url/petfood/api/v1/account/register")
    assert_status 200 "$status" "$prefix registration"

    otp=$(compose exec -T redis-production redis-cli --raw GET "acc:confirm:$email")
    [[ "$otp" =~ ^[0-9]{6}$ ]] || { printf '%s registration OTP was not stored\n' "$prefix" >&2; exit 1; }
    confirm_body=$(jq -nc --arg email "$email" --arg code "$otp" '{email:$email,code:$code}')
    status=$(curl -sS -D "$work_dir/${prefix}-confirm.headers" -o "$work_dir/${prefix}-confirm.json" \
        -w '%{http_code}' -c "$cookie_jar" -H "Origin: $browser_origin" \
        -H 'Content-Type: application/json' -d "$confirm_body" \
        "$base_url/petfood/api/v1/account/register/confirm")
    assert_status 200 "$status" "$prefix registration confirmation"
    ! grep -qi 'sid' "$work_dir/${prefix}-confirm.json"
    grep -qi '^Set-Cookie: sid=.*Path=/petfood' "$work_dir/${prefix}-confirm.headers"
    grep -qi '^Set-Cookie: sid=.*Secure' "$work_dir/${prefix}-confirm.headers"
    grep -qi '^Set-Cookie: sid=.*HttpOnly' "$work_dir/${prefix}-confirm.headers"
    grep -qi '^Set-Cookie: sid=.*SameSite=Lax' "$work_dir/${prefix}-confirm.headers"
    printf 'PASS %-36s secure scoped sid\n' "$prefix cookie contract"
}

register_and_confirm "$owner_email" "$owner_cookies" owner
register_and_confirm "$other_email" "$other_cookies" non-owner

status=$(request_status /dev/null -b "$owner_cookies" "$base_url/petfood/api/v1/account/profile/me")
assert_status 200 "$status" 'protected account profile'
status=$(request_status "$work_dir/pets.json" -b "$owner_cookies" "$base_url/petfood/api/v1/pets/me")
assert_status 200 "$status" 'protected pet collection'
jq -e '.content | type == "array"' "$work_dir/pets.json" >/dev/null
status=$(request_status "$work_dir/ingredients.json" -b "$owner_cookies" "$base_url/petfood/api/v1/ingredients")
assert_status 200 "$status" 'ingredient collection'
jq -e 'type == "array" and length > 0' "$work_dir/ingredients.json" >/dev/null
status=$(request_status "$work_dir/recipes.json" -b "$owner_cookies" "$base_url/petfood/api/v1/recipes")
assert_status 200 "$status" 'recipe collection'
jq -e 'type == "array"' "$work_dir/recipes.json" >/dev/null

status=$(request_status "$work_dir/upload-url.json" -b "$owner_cookies" \
    -H 'Content-Type: application/json' \
    -d '{"fileName":"../../rehearsal.png","contentType":"image/png"}' \
    "$base_url/petfood/api/v1/pets/photos/upload-url")
assert_status 200 "$status" 'owner photo upload URL'
object_key=$(jq -r .objectKey "$work_dir/upload-url.json")
[[ "$object_key" == pets/*/*.png ]]
upload_path=$(jq -r '.url | sub("^https?://[^/]+"; "")' "$work_dir/upload-url.json")
printf '\x89PNG\r\n\x1a\nREHEARSAL-CANARY' > "$work_dir/photo.png"
dd if=/dev/zero bs=1048576 count=2 >> "$work_dir/photo.png" 2>/dev/null
status=$(request_status /dev/null -b "$owner_cookies" -X PUT -H 'Content-Type: image/png' \
    --data-binary @"$work_dir/photo.png" "$base_url$upload_path")
assert_status 200 "$status" 'owner photo upload'

encoded_key=$(printf '%s' "$object_key" | jq -sRr @uri)
status=$(request_status "$work_dir/download-url.json" -b "$owner_cookies" \
    "$base_url/petfood/api/v1/pets/photos/download-url?objectKey=$encoded_key")
assert_status 200 "$status" 'owner photo download URL'
download_path=$(jq -r '.url | sub("^https?://[^/]+"; "")' "$work_dir/download-url.json")
status=$(curl -sS -D "$work_dir/photo.headers" -o "$work_dir/downloaded.png" \
    -w '%{http_code}' -b "$owner_cookies" -H "Origin: $browser_origin" "$base_url$download_path")
assert_status 200 "$status" 'owner photo download'
cmp "$work_dir/photo.png" "$work_dir/downloaded.png"
grep -qi '^Cache-Control: private, no-store' "$work_dir/photo.headers"
status=$(request_status /dev/null -b "$other_cookies" \
    "$base_url/petfood/api/v1/pets/photos/download-url?objectKey=$encoded_key")
assert_status 404 "$status" 'non-owner photo denial'

status=$(request_status "$work_dir/recommender.json" -b "$owner_cookies" "$base_url/petfood/recommender/")
assert_status 200 "$status" 'authenticated recommender route'
jq -e '.status == "healthy"' "$work_dir/recommender.json" >/dev/null
status=$(request_status /dev/null "$base_url/petfood/recommender/")
assert_status 401 "$status" 'unauthenticated recommender denial'

status=$(request_status /dev/null -b "$owner_cookies" -c "$owner_cookies" -X POST \
    "$base_url/petfood/api/v1/account/logout")
assert_status 200 "$status" logout
status=$(request_status /dev/null -b "$owner_cookies" "$base_url/petfood/api/v1/account/profile/me")
assert_status 401 "$status" 'post-logout protected denial'
login_body=$(jq -nc --arg email "$owner_email" --arg password "$password" \
    '{email:$email,password:$password}')
status=$(request_status "$work_dir/login.json" -b "$owner_cookies" -c "$owner_cookies" \
    -H 'Content-Type: application/json' -d "$login_body" \
    "$base_url/petfood/api/v1/account/login/email")
assert_status 200 "$status" login
! grep -qi 'sid' "$work_dir/login.json"

reset_body=$(jq -nc --arg email "$owner_email" '{email:$email}')
status=$(request_status /dev/null -H 'Content-Type: application/json' -d "$reset_body" \
    "$base_url/petfood/api/v1/account/password/reset/start")
assert_status 200 "$status" 'OTP issue'
status=$(request_status /dev/null -H 'Content-Type: application/json' -d "$reset_body" \
    "$base_url/petfood/api/v1/account/password/reset/start")
assert_status 429 "$status" 'OTP cooldown throttle'

status=$(curl -sS -D "$work_dir/cors.headers" -o /dev/null -w '%{http_code}' \
    -H "Origin: $browser_origin" -b "$owner_cookies" \
    "$base_url/petfood/api/v1/account/profile/me")
assert_status 200 "$status" 'trusted CORS request'
grep -Fqi "Access-Control-Allow-Origin: ${browser_origin}" "$work_dir/cors.headers"
grep -qi '^Access-Control-Allow-Credentials: true' "$work_dir/cors.headers"
curl -sS -D "$work_dir/untrusted-cors.headers" -o /dev/null \
    -H 'Origin: https://untrusted.invalid' -b "$owner_cookies" \
    "$base_url/petfood/api/v1/account/profile/me"
! grep -qi '^Access-Control-Allow-Origin:' "$work_dir/untrusted-cors.headers"
printf 'PASS %-36s exact allowlist\n' 'CORS contract'

status=$(curl -sS -o "$work_dir/nested.html" -w '%{http_code}' \
    "$base_url/petfood/pets/rehearsal-canary")
assert_status 200 "$status" 'nested SPA refresh'
grep -qi '<div id="root"' "$work_dir/nested.html"

published_count=0
while read -r container; do
    bindings=$(docker inspect -f '{{json .HostConfig.PortBindings}}' "$container")
    if [[ "$container" == "${compose_project}-frontend-production-1" ]]; then
        [[ "$bindings" == *'127.0.0.1'* ]]
        published_count=$((published_count + 1))
    elif [[ "$bindings" != "null" && "$bindings" != "{}" ]]; then
        printf 'Internal rehearsal container publishes a host port: %s %s\n' "$container" "$bindings" >&2
        exit 1
    fi
done < <(compose ps --format '{{.Name}}')
[[ "$published_count" -eq 1 ]]
printf 'PASS %-36s frontend loopback only\n' 'internal port isolation'

mail_ok=false
for _ in 1 2 3 4 5 6 7 8 9 10; do
    if docker exec "$mailhog_container" wget -qO- http://127.0.0.1:8025/api/v2/messages \
        | jq -e --arg owner "$owner_email" --arg other "$other_email" \
            '[.items[].To[] | .Mailbox + "@" + .Domain] as $recipients | ($recipients | index($owner)) != null and ($recipients | index($other)) != null' \
            >/dev/null 2>&1; then
        mail_ok=true
        break
    fi
    sleep 1
done
[[ "$mail_ok" == true ]] || { printf 'Notification canary messages were not delivered to MailHog\n' >&2; exit 1; }
printf 'PASS %-36s isolated MailHog\n' 'notification delivery canary'

printf 'Production rehearsal smoke test passed\n'
