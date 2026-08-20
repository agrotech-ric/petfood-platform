#!/usr/bin/env bash
set -euo pipefail

edge_origin=${ROLLBACK_EDGE_ORIGIN:-http://127.0.0.1:18084}
public_base=${ROLLBACK_PUBLIC_BASE:-$edge_origin/petfood}
redis_container=${ROLLBACK_REDIS_CONTAINER:-petfood-restore-legacy-redis-20260819}
postgres_container=${ROLLBACK_POSTGRES_CONTAINER:-petfood-restore-legacy-postgres-20260819}
pets_container=${ROLLBACK_PETS_CONTAINER:-petfood-restore-legacy-pets-20260819}
mailhog_container=${ROLLBACK_MAILHOG_CONTAINER:-petfood-rehearsal-mailhog}
container_prefix=${ROLLBACK_CONTAINER_PREFIX:-petfood-rollback-legacy-}

case "$edge_origin" in
    http://127.0.0.1:*|http://localhost:*) ;;
    *)
        printf 'Refusing to run rollback canaries against non-loopback origin: %s\n' "$edge_origin" >&2
        exit 1
        ;;
esac

command -v curl >/dev/null
command -v jq >/dev/null
command -v docker >/dev/null

run_id="$(date -u +%Y%m%d%H%M%S)-$$"
email="rollback-canary-${run_id}@example.test"
password="Ra9#${run_id}"
work_dir=$(mktemp -d)
cookie_jar="$work_dir/cookies"
object_key=''

cleanup() {
    if [[ "$(docker inspect -f '{{.State.Status}}' "$postgres_container" 2>/dev/null || true)" == running ]]; then
        cleanup_sql="delete from public.users where email = '${email}';"
        docker exec "$postgres_container" sh -lc \
            'psql -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "$1"' \
            sh "$cleanup_sql" >/dev/null 2>&1 || true
    fi
    if [[ -n "$object_key" ]]; then
        docker exec "$pets_container" unlink "/data/pets-photos/$object_key" >/dev/null 2>&1 || true
    fi
    docker exec "$redis_container" redis-cli --scan --pattern "*${email}*" | while read -r key; do
        [[ -z "$key" ]] || docker exec "$redis_container" redis-cli DEL "$key" >/dev/null
    done
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
    curl --noproxy '*' -sS -o "$output" -w '%{http_code}' "$@"
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

status=$(request_status /dev/null "$edge_origin/")
assert_status 404 "$status" 'rollback root boundary'
status=$(request_status /dev/null "$public_base/")
assert_status 200 "$status" 'rollback frontend'
status=$(request_status "$work_dir/nested.html" "$public_base/pets/rollback-canary")
assert_status 200 "$status" 'rollback nested SPA refresh'
grep -qi '<div id="root"' "$work_dir/nested.html"

register_body=$(jq -nc --arg email "$email" --arg password "$password" \
    '{email:$email,firstName:"Rollback",lastName:"Canary",password:$password}')
status=$(request_status "$work_dir/register.json" -H 'Content-Type: application/json' \
    -d "$register_body" "$public_base/api/v1/account/register")
assert_status 200 "$status" 'rollback registration'
otp=$(docker exec "$redis_container" redis-cli --raw GET "acc:confirm:$email")
[[ "$otp" =~ ^[0-9]{6}$ ]] || { printf 'Rollback registration OTP was not stored\n' >&2; exit 1; }
confirm_body=$(jq -nc --arg email "$email" --arg code "$otp" '{email:$email,code:$code}')
status=$(curl --noproxy '*' -sS -D "$work_dir/confirm.headers" -o "$work_dir/confirm.json" \
    -w '%{http_code}' -c "$cookie_jar" -H 'Content-Type: application/json' \
    -d "$confirm_body" "$public_base/api/v1/account/register/confirm")
assert_status 200 "$status" 'rollback registration confirmation'
grep -qi '^Set-Cookie: sid=.*HttpOnly' "$work_dir/confirm.headers"

status=$(request_status "$work_dir/profile.json" -b "$cookie_jar" \
    "$public_base/api/v1/account/profile/me")
assert_status 200 "$status" 'rollback account read'
[[ "$(jq -r .email "$work_dir/profile.json")" == "$email" ]]
status=$(request_status "$work_dir/pets.json" -b "$cookie_jar" \
    "$public_base/api/v1/pets/me")
assert_status 200 "$status" 'rollback pet read'
jq -e '.content | type == "array"' "$work_dir/pets.json" >/dev/null

status=$(request_status "$work_dir/upload-url.json" -b "$cookie_jar" \
    -H 'Content-Type: application/json' \
    -d '{"fileName":"rollback.png","contentType":"image/png"}' \
    "$public_base/api/v1/pets/photos/upload-url")
assert_status 200 "$status" 'rollback photo upload URL'
object_key=$(jq -r .objectKey "$work_dir/upload-url.json")
[[ "$object_key" == pets/*/*.png ]]
upload_path=$(jq -r '.url | sub("^https?://[^/]+"; "")' "$work_dir/upload-url.json")
printf '\x89PNG\r\n\x1a\nROLLBACK-CANARY' > "$work_dir/photo.png"
status=$(request_status /dev/null -X PUT -H 'Content-Type: image/png' \
    --data-binary @"$work_dir/photo.png" "$edge_origin$upload_path")
assert_status 200 "$status" 'rollback photo upload'
encoded_key=$(printf '%s' "$object_key" | jq -sRr @uri)
status=$(request_status "$work_dir/download-url.json" -b "$cookie_jar" \
    "$public_base/api/v1/pets/photos/download-url?objectKey=$encoded_key")
assert_status 200 "$status" 'rollback photo download URL'
download_path=$(jq -r '.url | sub("^https?://[^/]+"; "")' "$work_dir/download-url.json")
status=$(request_status "$work_dir/downloaded.png" "$edge_origin$download_path")
assert_status 200 "$status" 'rollback media read'
cmp "$work_dir/photo.png" "$work_dir/downloaded.png"

status=$(request_status "$work_dir/recommender.json" "$public_base/recommender/")
assert_status 200 "$status" 'rollback recommender route'
jq -e '.status == "healthy"' "$work_dir/recommender.json" >/dev/null

status=$(request_status /dev/null -b "$cookie_jar" -c "$cookie_jar" -X POST \
    "$public_base/api/v1/account/logout")
assert_status 200 "$status" 'rollback logout'
status=$(request_status /dev/null -b "$cookie_jar" "$public_base/api/v1/account/profile/me")
assert_status 401 "$status" 'rollback post-logout denial'
login_body=$(jq -nc --arg email "$email" --arg password "$password" \
    '{email:$email,password:$password}')
status=$(request_status "$work_dir/login.json" -b "$cookie_jar" -c "$cookie_jar" \
    -H 'Content-Type: application/json' -d "$login_body" \
    "$public_base/api/v1/account/login/email")
assert_status 200 "$status" 'rollback login'

mail_ok=false
for _ in 1 2 3 4 5 6 7 8 9 10; do
    if docker exec "$mailhog_container" wget -qO- http://127.0.0.1:8025/api/v2/messages \
        | jq -e --arg email "$email" \
            '[.items[].To[] | .Mailbox + "@" + .Domain] | index($email) != null' \
            >/dev/null 2>&1; then
        mail_ok=true
        break
    fi
    sleep 1
done
[[ "$mail_ok" == true ]] || { printf 'Rollback notification did not reach isolated MailHog\n' >&2; exit 1; }
printf 'PASS %-36s isolated MailHog\n' 'rollback notification canary'

published_count=0
while read -r container; do
    bindings=$(docker inspect -f '{{json .HostConfig.PortBindings}}' "$container")
    if [[ "$container" == "${container_prefix}public-edge-20260819" ]]; then
        [[ "$bindings" == *'127.0.0.1'* ]]
        published_count=$((published_count + 1))
    elif [[ "$bindings" != "null" && "$bindings" != "{}" ]]; then
        printf 'Rollback internal container publishes a host port: %s %s\n' "$container" "$bindings" >&2
        exit 1
    fi
done < <(docker ps --format '{{.Names}}' | grep -E '^(petfood-restore-legacy-|petfood-rollback-legacy-)')
[[ "$published_count" -eq 1 ]]
printf 'PASS %-36s rollback edge only\n' 'rollback port isolation'

printf 'Legacy rollback smoke test passed\n'
