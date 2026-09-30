#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

DATABASE="${1:-${D1_DATABASE:-fsx-database-raphael}}"
BACKUP_ROOT="${BACKUP_ROOT:-$HOME/Backups}"
STAMP="$(date +%F-%H%M%S)"
OUT_DIR="$BACKUP_ROOT/fsx-$STAMP"
SQL_FILE="$OUT_DIR/fsx-$STAMP.sql"
SQLITE_FILE="$OUT_DIR/.fsx-$STAMP.tmp.sqlite"
CSV_DIR="$OUT_DIR/csv"

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

echo "→ Writing one CSV per table to $CSV_DIR"
table_count=0
while IFS= read -r table; do
  [ -n "$table" ] || continue
  sqlite3 -header -csv "$SQLITE_FILE" "SELECT * FROM \"$table\";" > "$CSV_DIR/$table.csv"
  rows="$(sqlite3 "$SQLITE_FILE" "SELECT count(*) FROM \"$table\";")"
  table_count=$((table_count + 1))
  echo "   • $table.csv ($rows rows)"
done < <(sqlite3 "$SQLITE_FILE" "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name != 'd1_migrations' ORDER BY name;")

rm -f "$SQLITE_FILE"

echo "✅ Backup complete: $OUT_DIR ($table_count tables)"
