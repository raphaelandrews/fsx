#!/usr/bin/env bash
set -euo pipefail
umask 077

BACKUP_SQL="${1:?Usage: verify-d1-backup.sh /path/to/fsx-backup.sql}"
[ -f "$BACKUP_SQL" ] || {
  echo "Backup SQL file not found." >&2
  exit 1
}
command -v sqlite3 >/dev/null 2>&1 || {
  echo "sqlite3 is required but was not found on PATH." >&2
  exit 1
}

RESTORE_DB="$(mktemp "${TMPDIR:-/tmp}/fsx-restore-XXXXXX.sqlite")"
trap 'rm -f "$RESTORE_DB"' EXIT

sqlite3 \
  -cmd "PRAGMA journal_mode=MEMORY;" \
  -cmd "PRAGMA synchronous=OFF;" \
  "$RESTORE_DB" < "$BACKUP_SQL" > /dev/null

INTEGRITY_RESULT="$(sqlite3 "$RESTORE_DB" "PRAGMA integrity_check;")"
[ "$INTEGRITY_RESULT" = "ok" ] || {
  echo "Restored database failed SQLite integrity_check." >&2
  exit 1
}

FOREIGN_KEY_ERRORS="$(sqlite3 "$RESTORE_DB" "PRAGMA foreign_key_check;")"
[ -z "$FOREIGN_KEY_ERRORS" ] || {
  echo "Restored database has foreign-key violations." >&2
  exit 1
}

TABLE_COUNT="$(sqlite3 "$RESTORE_DB" "SELECT count(*) FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%';")"
echo "Backup restored and validated successfully ($TABLE_COUNT tables)."
