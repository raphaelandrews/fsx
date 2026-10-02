#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://www.fsx.org.br}"
MEDIA_SMOKE_URL="${MEDIA_SMOKE_URL:-}"
BASE_URL="${BASE_URL%/}"

TEMP_BODY="$(mktemp "${TMPDIR:-/tmp}/fsx-smoke-XXXXXX")"
trap 'rm -f "$TEMP_BODY"' EXIT

status_for() {
  curl --silent --show-error --output "$TEMP_BODY" --max-time 20 --write-out '%{http_code}' "$1"
}

expect_status() {
  local url="$1"
  local expected="$2"
  local actual
  actual="$(status_for "$url")"
  if [ "$actual" != "$expected" ]; then
    printf 'Expected HTTP %s, received %s for %s\n' "$expected" "$actual" "$url" >&2
    exit 1
  fi
}

expect_status "$BASE_URL/api/auth/ok" 200
expect_status "$BASE_URL/" 200
expect_status "$BASE_URL/login" 200

PUBLIC_QUERY_URL="$BASE_URL/api/trpc/posts.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%7D%7D%7D"
expect_status "$PUBLIC_QUERY_URL" 200
python3 -c 'import json,sys; payload=json.load(open(sys.argv[1])); items=payload if isinstance(payload,list) else [payload]; assert items and all("result" in item and "error" not in item for item in items)' "$TEMP_BODY"

ADMIN_GUARD_URL="$BASE_URL/api/trpc/stats.counts?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%7D%7D%7D"
expect_status "$ADMIN_GUARD_URL" 401

expect_status "$BASE_URL/sitemap.xml" 200
expect_status "$BASE_URL/pagina-que-nao-existe" 404

API_CACHE_CONTROL="$(curl --silent --show-error --max-time 20 --output /dev/null --dump-header - "$PUBLIC_QUERY_URL" | tr -d '\r' | awk -F': ' 'tolower($1)=="cache-control"{print tolower($2)}')"
case "$API_CACHE_CONTROL" in
  *no-store*) ;;
  *) printf 'API responses must send Cache-Control: no-store to browsers; got "%s".\n' "$API_CACHE_CONTROL" >&2; exit 1 ;;
esac

if [ -z "$MEDIA_SMOKE_URL" ]; then
  printf 'Skipping media check (set MEDIA_SMOKE_URL to a known /api/media/ image).\n'
  printf 'Deployment smoke test passed for %s.\n' "$BASE_URL"
  exit 0
fi
case "$MEDIA_SMOKE_URL" in
  "$BASE_URL"/api/media/*) ;;
  *) printf 'MEDIA_SMOKE_URL must use the deployment /api/media/ route.\n' >&2; exit 1 ;;
esac
MEDIA_RESULT="$(curl --silent --show-error --head --max-time 20 --write-out '%{http_code} %{content_type}' --output /dev/null "$MEDIA_SMOKE_URL")"
case "$MEDIA_RESULT" in
  200\ image/*) ;;
  *) printf 'Expected image media response; received %s.\n' "$MEDIA_RESULT" >&2; exit 1 ;;
esac

printf 'Deployment smoke test passed for %s.\n' "$BASE_URL"
