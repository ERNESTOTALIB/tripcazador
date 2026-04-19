#!/usr/bin/env bash
# smoke_test.sh — comprobacion rapida de endpoints publicos TripCazador.
# Uso: ./smoke_test.sh [BASE_URL]
# Exit 0 si todo OK, 1 si algo falla.
set -u

BASE_API="${1:-https://api.tripcazador.com}"
BASE_WEB="${WEB_URL:-https://tripcazador.com}"

fail=0

check() {
  local name="$1"
  local url="$2"
  local expected="${3:-200}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url")
  if [[ "$code" == "$expected" ]]; then
    echo "[OK]   $name ($code) $url"
  else
    echo "[FAIL] $name (got $code, want $expected) $url"
    fail=1
  fi
}

check_json_key() {
  local name="$1"
  local url="$2"
  local key="$3"
  local body
  body=$(curl -s --max-time 10 "$url")
  if echo "$body" | grep -q "\"$key\""; then
    echo "[OK]   $name contiene key '$key'"
  else
    echo "[FAIL] $name no contiene '$key' en $url"
    fail=1
  fi
}

echo "=== TripCazador smoke test ==="
echo "API: $BASE_API"
echo "WEB: $BASE_WEB"
echo

check "API /health"           "$BASE_API/api/health"
check "API /deals"            "$BASE_API/api/deals"
check "API /deals/top"        "$BASE_API/api/deals/top"
check "API /stats"            "$BASE_API/api/stats"
check "API /regions"          "$BASE_API/api/regions"
check "Web root"              "$BASE_WEB"
check "Web /deals"            "$BASE_WEB/deals"
check "Web /sitemap.xml"      "$BASE_WEB/sitemap.xml"
check "Web /robots.txt"       "$BASE_WEB/robots.txt"

check_json_key "API /health"  "$BASE_API/api/health" "status"
check_json_key "API /stats"   "$BASE_API/api/stats"  "total"

echo
if [[ $fail -eq 0 ]]; then
  echo "=== TODO OK ==="
  exit 0
else
  echo "=== SMOKE FAIL ==="
  exit 1
fi
