#!/usr/bin/env bash
set -euo pipefail
trap 'printf "share/export smoke failed near line %s\n" "$LINENO" >&2' ERR

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"

base_url=${SHARE_TEST_BASE_URL:-http://10.1.10.144:18190}
browser_origin=${SHARE_TEST_ORIGIN:-http://10.1.10.144:5174}
artifact_dir=${SHARE_TEST_ARTIFACT_DIR:-}
work_dir=$(mktemp -d)
owner_cookie="$work_dir/owner.cookies"
other_cookie="$work_dir/other.cookies"
pet_id=''
recipe_id=''

cleanup() {
    if [[ -n "$artifact_dir" ]]; then
        mkdir -p "$artifact_dir"
        find "$work_dir" -maxdepth 1 -type f -name '*.pdf' -exec cp {} "$artifact_dir/" \;
    fi
    if [[ -n "$recipe_id" && -s "$owner_cookie" ]]; then
        curl -sS -b "$owner_cookie" -X DELETE "$base_url/api/v1/recipes/$recipe_id" >/dev/null 2>&1 || true
    fi
    if [[ -n "$pet_id" && -s "$owner_cookie" ]]; then
        curl -sS -b "$owner_cookie" -X DELETE "$base_url/api/v1/pets/$pet_id" >/dev/null 2>&1 || true
    fi
    for jar in "$owner_cookie" "$other_cookie"; do
        [[ -s "$jar" ]] || continue
        curl -sS -b "$jar" -X DELETE "$base_url/api/v1/account" >/dev/null 2>&1 || true
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
    local expected=$1 actual=$2 label=$3
    if [[ "$actual" != "$expected" ]]; then
        printf '%s: expected HTTP %s, got %s\n' "$label" "$expected" "$actual" >&2
        exit 1
    fi
}

register_user() {
    local email=$1 jar=$2 prefix=$3
    local password='ShareTest9#'
    local body status otp confirm
    body=$(jq -nc --arg email "$email" --arg password "$password" '{email:$email,firstName:"Share",lastName:"Test",password:$password}')
    status=$(request_status "$work_dir/$prefix-register.json" -H 'Content-Type: application/json' -d "$body" "$base_url/api/v1/account/register")
    assert_status 200 "$status" "$prefix-registration"
    otp=$(docker compose -f docker-compose.sandbox.yml exec -T redis-sandbox redis-cli --raw GET "acc:confirm:$email")
    [[ -n "$otp" ]]
    confirm=$(jq -nc --arg email "$email" --arg code "$otp" '{email:$email,code:$code}')
    status=$(request_status "$work_dir/$prefix-confirm.json" -c "$jar" -H 'Content-Type: application/json' -d "$confirm" "$base_url/api/v1/account/register/confirm")
    assert_status 200 "$status" "$prefix-confirmation"
}

run_id="$(date +%s)-$$"
register_user "share-owner-$run_id@example.test" "$owner_cookie" owner
register_user "share-other-$run_id@example.test" "$other_cookie" other

status=$(request_status "$work_dir/species.json" -b "$owner_cookie" "$base_url/api/v1/pets/ref/species")
assert_status 200 "$status" species
species_id=$(jq -er '.[0].id' "$work_dir/species.json")
status=$(request_status "$work_dir/breeds.json" -b "$owner_cookie" "$base_url/api/v1/pets/ref/breeds?speciesId=$species_id")
assert_status 200 "$status" breeds
breed_id=$(jq -er '.[0].id' "$work_dir/breeds.json")
status=$(request_status "$work_dir/colors.json" -b "$owner_cookie" "$base_url/api/v1/pets/ref/colors")
assert_status 200 "$status" colors
color_id=$(jq -er '.[0].id' "$work_dir/colors.json")

pet_body=$(jq -nc --argjson species "$species_id" --argjson breed "$breed_id" --argjson color "$color_id" \
    '{speciesId:$species,breedId:$breed,name:"Share Test",gender:"male",colorId:$color,birthDate:"2022-01-01",passportId:"PRIVATE-PASSPORT",weightKg:12.5,comments:"Public description"}')
status=$(request_status "$work_dir/pet.json" -b "$owner_cookie" -H 'Content-Type: application/json' -d "$pet_body" "$base_url/api/v1/pets")
assert_status 200 "$status" pet-create
pet_id=$(jq -er .id "$work_dir/pet.json")

recipe_body=$(jq -nc --arg pet "$pet_id" '{petId:$pet,name:"Share recipe",description:"Calculated smoke recipe",ageCategory:"adults",breedSize:"medium",targetWeightKg:12.5,targetAgeMonths:48,targetGender:"male",symptomIds:[],maximizeNutrients:["protein"],ingredients:[],nutrientConstraints:[],calculationResult:{calories:420,dailyNorm:615,dailyCaloriesNorm:840,ownerId:"PRIVATE",composition:[{ingredientId:999,label:"Turkey",percent:55,grams:338},{label:"Rice",percent:24,grams:148},{label:"Carrot",percent:13,grams:80},{label:"Oil",percent:8,grams:49}],nutrition:[{label:"Moisture",value:68.8,unit:"g"},{label:"Protein",value:18.4,unit:"g"},{label:"Fat",value:7.2,unit:"g"},{label:"Carbohydrates",value:12.7,unit:"g"}],nutrients:[{label:"Fiber",value:2.8,unit:"g"},{label:"Choline",value:312,unit:"mg"},{label:"Linoleic acid",value:2.1,unit:"g"}],minerals:[{label:"Calcium",current:1.1,norm:1,unit:"g",percent:110},{label:"Phosphorus",current:0.82,norm:1,unit:"g",percent:82},{label:"Magnesium",current:0.14,norm:0.1,unit:"g",percent:140}],vitamins:[{label:"Vitamin A",current:0.75,norm:1,unit:"mg",percent:75},{label:"Vitamin D",current:1.3,norm:1,unit:"mg",percent:130},{label:"Vitamin E",current:0.42,norm:1,unit:"mg",percent:42}],digestion:{protein:[{time:0,remaining:40},{time:2,remaining:31},{time:4,remaining:19},{time:6,remaining:9}],fat:[],carbs:[],proteinAbsorption:77.5,proteinForecast:[],fatForecast:[],carbsForecast:[]}},calculationVersion:"smoke-1"}')
status=$(request_status "$work_dir/recipe.json" -b "$owner_cookie" -H 'Content-Type: application/json' -d "$recipe_body" "$base_url/api/v1/recipes")
assert_status 201 "$status" recipe-create
recipe_id=$(jq -er .id "$work_dir/recipe.json")

status=$(request_status "$work_dir/pet-unshared.pdf" -b "$owner_cookie" "$base_url/api/v1/pets/$pet_id/export.pdf?locale=ru")
assert_status 200 "$status" pet-pdf-unshared
head -c 4 "$work_dir/pet-unshared.pdf" | grep -q '%PDF'
status=$(request_status "$work_dir/recipe-unshared.pdf" -b "$owner_cookie" "$base_url/api/v1/recipes/$recipe_id/export.pdf?locale=ru")
assert_status 200 "$status" recipe-pdf-unshared
head -c 4 "$work_dir/recipe-unshared.pdf" | grep -q '%PDF'

status=$(request_status "$work_dir/pet-share.json" -b "$owner_cookie" -H 'Content-Type: application/json' -d '{}' "$base_url/api/v1/pets/$pet_id/share")
assert_status 200 "$status" pet-share-create
pet_url=$(jq -er .url "$work_dir/pet-share.json")
pet_token=${pet_url#*#}
[[ "$pet_url" == */shared/pet#v1.* ]]
status=$(request_status "$work_dir/pet-share-repeat.json" -b "$owner_cookie" -H 'Content-Type: application/json' -d '{}' "$base_url/api/v1/pets/$pet_id/share")
assert_status 200 "$status" pet-share-idempotent
[[ "$(jq -r .url "$work_dir/pet-share-repeat.json")" == "$pet_url" ]]
for index in $(seq 1 8); do
    request_status "$work_dir/pet-share-concurrent-$index.json" -b "$owner_cookie" \
        -H 'Content-Type: application/json' -d '{}' "$base_url/api/v1/pets/$pet_id/share" \
        >"$work_dir/pet-share-concurrent-$index.status" &
done
wait
for index in $(seq 1 8); do
    [[ "$(<"$work_dir/pet-share-concurrent-$index.status")" == 200 ]]
    [[ "$(jq -r .url "$work_dir/pet-share-concurrent-$index.json")" == "$pet_url" ]]
done

status=$(curl -sS -D "$work_dir/public-pet.headers" -o "$work_dir/public-pet.json" -w '%{http_code}' -H "X-Share-Token: $pet_token" "$base_url/api/v1/public/shares/pet")
assert_status 200 "$status" public-pet
grep -qi '^Cache-Control: no-store' "$work_dir/public-pet.headers"
grep -qi '^Referrer-Policy: no-referrer' "$work_dir/public-pet.headers"
jq -e '[.. | objects | keys[]] | all(. != "id" and . != "ownerId" and . != "passportId" and . != "photoObjectKey")' "$work_dir/public-pet.json" >/dev/null
updated_pet_body=$(jq -nc --argjson species "$species_id" --argjson breed "$breed_id" --argjson color "$color_id" \
    '{speciesId:$species,breedId:$breed,name:"Share Test",gender:"male",colorId:$color,birthDate:"2022-01-01",passportId:"PRIVATE-PASSPORT",weightKg:12.5,comments:"Updated live description"}')
status=$(request_status /dev/null -b "$owner_cookie" -X PATCH -H 'Content-Type: application/json' \
    -d "$updated_pet_body" "$base_url/api/v1/pets/$pet_id")
assert_status 200 "$status" pet-live-update
status=$(request_status "$work_dir/public-pet-updated.json" -H "X-Share-Token: $pet_token" "$base_url/api/v1/public/shares/pet")
assert_status 200 "$status" public-pet-live-update
[[ "$(jq -r .pet.comments "$work_dir/public-pet-updated.json")" == "Updated live description" ]]
status=$(request_status /dev/null -H "X-Share-Token: $pet_token" "$base_url/api/v1/public/shares/pet/photo")
assert_status 404 "$status" missing-public-photo

for locale in ru en kz; do
    status=$(request_status "$work_dir/pet-$locale.pdf" -b "$owner_cookie" "$base_url/api/v1/pets/$pet_id/export.pdf?locale=$locale")
    assert_status 200 "$status" "pet-pdf-$locale"
    head -c 4 "$work_dir/pet-$locale.pdf" | grep -q '%PDF'
done

status=$(request_status "$work_dir/pet-rotated.json" -b "$owner_cookie" -H 'Content-Type: application/json' -d '{}' "$base_url/api/v1/pets/$pet_id/share/rotate")
assert_status 200 "$status" pet-share-rotate
rotated_pet_token=$(jq -er .url "$work_dir/pet-rotated.json"); rotated_pet_token=${rotated_pet_token#*#}
[[ "$rotated_pet_token" != "$pet_token" ]]
status=$(request_status /dev/null -H "X-Share-Token: $pet_token" "$base_url/api/v1/public/shares/pet")
assert_status 404 "$status" old-pet-token

status=$(request_status "$work_dir/recipe-share.json" -b "$owner_cookie" -H 'Content-Type: application/json' -d '{}' "$base_url/api/v1/recipes/$recipe_id/share")
assert_status 200 "$status" recipe-share-create
recipe_token=$(jq -er .url "$work_dir/recipe-share.json"); recipe_token=${recipe_token#*#}
status=$(request_status "$work_dir/public-recipe.json" -H "X-Share-Token: $recipe_token" "$base_url/api/v1/public/shares/recipe")
assert_status 200 "$status" public-recipe
jq -e '.calculationResult.calories == 420 and (.linkedPet.name == "Share Test")' "$work_dir/public-recipe.json" >/dev/null
jq -e '[.. | objects | keys[]] | all(. != "id" and . != "ownerId" and . != "ingredientId" and . != "photoUrl" and . != "photoObjectKey")' "$work_dir/public-recipe.json" >/dev/null
status=$(request_status /dev/null -H "X-Share-Token: $recipe_token" "$base_url/api/v1/public/shares/pet")
assert_status 404 "$status" wrong-public-resource-type
status=$(request_status "$work_dir/recipe.pdf" -b "$owner_cookie" "$base_url/api/v1/recipes/$recipe_id/export.pdf?locale=kz")
assert_status 200 "$status" recipe-pdf
head -c 4 "$work_dir/recipe.pdf" | grep -q '%PDF'

status=$(request_status /dev/null -b "$other_cookie" "$base_url/api/v1/pets/$pet_id/share")
assert_status 404 "$status" non-owner-pet-share
status=$(request_status /dev/null -b "$other_cookie" "$base_url/api/v1/recipes/$recipe_id/export.pdf?locale=ru")
assert_status 404 "$status" non-owner-recipe-pdf

draft_body=$(jq -nc --arg pet "$pet_id" '{petId:$pet,name:"Share recipe",description:"Draft",ageCategory:"adults",breedSize:"medium",targetWeightKg:12.5,targetAgeMonths:48,targetGender:"male",symptomIds:[],maximizeNutrients:[],ingredients:[],nutrientConstraints:[]}')
status=$(request_status /dev/null -b "$owner_cookie" -X PATCH -H 'Content-Type: application/json' -d "$draft_body" "$base_url/api/v1/recipes/$recipe_id")
assert_status 200 "$status" recipe-to-draft
status=$(request_status /dev/null -H "X-Share-Token: $recipe_token" "$base_url/api/v1/public/shares/recipe")
assert_status 404 "$status" draft-share-unavailable
status=$(request_status /dev/null -b "$owner_cookie" -X PATCH -H 'Content-Type: application/json' -d "$recipe_body" "$base_url/api/v1/recipes/$recipe_id")
assert_status 200 "$status" recipe-recalculated
status=$(request_status /dev/null -H "X-Share-Token: $recipe_token" "$base_url/api/v1/public/shares/recipe")
assert_status 200 "$status" recipe-share-restored

status=$(request_status /dev/null -b "$owner_cookie" -X DELETE "$base_url/api/v1/recipes/$recipe_id/share")
assert_status 204 "$status" recipe-share-revoke
status=$(request_status /dev/null -H "X-Share-Token: $recipe_token" "$base_url/api/v1/public/shares/recipe")
assert_status 404 "$status" revoked-recipe-share

for index in $(seq 1 40); do
    request_status /dev/null -H 'X-Share-Token: malformed' "$base_url/api/v1/public/shares/pet" \
        >"$work_dir/rate-$index.status" &
done
wait
grep -lqx 429 "$work_dir"/rate-*.status >/dev/null
status=$(request_status /dev/null -H "X-Share-Token: $rotated_pet_token" "$base_url/api/v1/public/shares/pet")
assert_status 429 "$status" rate-limit-token-independent

for container in pets_sandbox_gateway_service pets_sandbox_pets_service; do
    for token in "$pet_token" "$rotated_pet_token" "$recipe_token"; do
        if docker logs "$container" 2>&1 | grep -Fq -- "$token"; then
            printf 'share token leaked into %s logs\n' "$container" >&2
            exit 1
        fi
    done
done

status=$(request_status /dev/null -b "$owner_cookie" -X DELETE "$base_url/api/v1/recipes/$recipe_id")
assert_status 204 "$status" recipe-delete
recipe_id=''
status=$(request_status /dev/null -b "$owner_cookie" -X DELETE "$base_url/api/v1/pets/$pet_id")
assert_status 200 "$status" pet-delete
pet_id=''
sleep 5
status=$(request_status /dev/null -H "X-Share-Token: $rotated_pet_token" "$base_url/api/v1/public/shares/pet")
assert_status 404 "$status" deleted-pet-share

echo "Share and PDF export smoke test passed"
