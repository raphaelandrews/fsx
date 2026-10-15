#!/usr/bin/env bash
set -euo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

DATABASE="${1:-${D1_DATABASE:-fsx-database-raphael}}"
[[ "$DATABASE" =~ ^[A-Za-z0-9_-]+$ ]] || {
  echo "Invalid D1 database name." >&2
  exit 1
}
BACKUP_ROOT="${BACKUP_ROOT:-$HOME/Backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-90}"
[[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]] && [ "$RETENTION_DAYS" -ge 1 ] && [ "$RETENTION_DAYS" -le 3650 ] || {
  echo "BACKUP_RETENTION_DAYS must be between 1 and 3650." >&2
  exit 1
}
STAMP="$(date +%F-%H%M%S)"
OUT_DIR="$BACKUP_ROOT/fsx-$STAMP"
SQL_FILE="$OUT_DIR/fsx-$STAMP.sql"
SQLITE_FILE="$OUT_DIR/.fsx-$STAMP.tmp.sqlite"
CSV_DIR="$OUT_DIR/csv"

cleanup() {
  rm -f "$SQLITE_FILE"
}
trap cleanup EXIT

WRANGLER_BIN="${WRANGLER_BIN:-$REPO_ROOT/apps/web/node_modules/.bin/wrangler}"
if [ -x "$WRANGLER_BIN" ]; then
  WRANGLER=("$WRANGLER_BIN")
elif command -v bunx >/dev/null 2>&1; then
  WRANGLER=(bunx wrangler)
elif command -v wrangler >/dev/null 2>&1; then
  WRANGLER=(wrangler)
else
  echo "wrangler not found. Run 'bun install' in the repo root first." >&2
  exit 1
fi

command -v sqlite3 >/dev/null 2>&1 || {
  echo "sqlite3 is required but was not found on PATH." >&2
  exit 1
}
command -v python3 >/dev/null 2>&1 || {
  echo "python3 is required to safely export CSV files." >&2
  exit 1
}

mkdir -p "$OUT_DIR" "$CSV_DIR"

echo "→ Exporting '$DATABASE' (remote) to $SQL_FILE"
"${WRANGLER[@]}" d1 export "$DATABASE" --remote --output="$SQL_FILE" --skip-confirmation

DUMP_SIZE="$(du -h "$SQL_FILE" | cut -f1)"
echo "→ Importing $DUMP_SIZE dump into a temporary SQLite database (silent; can take a while)"
rm -f "$SQLITE_FILE"
sqlite3 \
  -cmd "PRAGMA journal_mode=MEMORY;" \
  -cmd "PRAGMA synchronous=OFF;" \
  "$SQLITE_FILE" < "$SQL_FILE" > /dev/null
INTEGRITY_RESULT="$(sqlite3 "$SQLITE_FILE" "PRAGMA integrity_check;")"
[ "$INTEGRITY_RESULT" = "ok" ] || {
  echo "Backup integrity check failed." >&2
  exit 1
}

echo "→ Writing one CSV per table to $CSV_DIR"
python3 "$SCRIPT_DIR/export_d1_csv.py" "$SQLITE_FILE" "$CSV_DIR"

if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$SQL_FILE" > "$OUT_DIR/SHA256SUMS"
fi

cat > "$OUT_DIR/manifest.txt" <<EOF
database=$DATABASE
created_at=$(date --iso-8601=seconds)
sql_file=$(basename "$SQL_FILE")
retention_days=$RETENTION_DAYS
EOF

RETENTION_CUTOFF="$(date -d "$RETENTION_DAYS days ago" +%s)"
for candidate in "$BACKUP_ROOT"/fsx-*; do
  [ -d "$candidate" ] || continue
  candidate_name="${candidate##*/}"
  [[ "$candidate_name" =~ ^fsx-[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{6}$ ]] || continue
  candidate_mtime="$(stat -c %Y "$candidate")"
  if [ "$candidate_mtime" -lt "$RETENTION_CUTOFF" ]; then
    rm -rf -- "$candidate"
  fi
done

echo "✅ Backup complete: $OUT_DIR ($RETENTION_DAYS-day retention)"
