#!/usr/bin/env bash
# Restores a database dump produced by scripts/backup-db.sh into a target
# database (Prompt 45 Part E). Defaults to restoring into the app's own
# configured database (apps/api/.env) — pass a different target name as
# the 2nd argument to restore into a fresh/temporary database instead,
# which is how this script's own recovery mechanism gets tested without
# touching the real data.
#
# Usage: scripts/restore-db.sh <dump-file> [target-database-name]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_ROOT/apps/api/.env"
DUMP_FILE="${1:-}"

if [[ -z "$DUMP_FILE" || ! -f "$DUMP_FILE" ]]; then
  echo "Usage: scripts/restore-db.sh <dump-file> [target-database-name]" >&2
  echo "✖ Dump file not found: ${DUMP_FILE:-<none given>}" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "✖ Could not find $ENV_FILE" >&2
  exit 1
fi

db_env() {
  grep -E "^${1}=" "$ENV_FILE" | tail -n1 | cut -d '=' -f2-
}

DB_HOST=$(db_env DB_HOST)
DB_PORT=$(db_env DB_PORT)
DB_USERNAME=$(db_env DB_USERNAME)
DB_PASSWORD=$(db_env DB_PASSWORD)
TARGET_DB="${2:-$(db_env DB_DATABASE)}"

echo "Restoring $DUMP_FILE into database '$TARGET_DB' on $DB_HOST:$DB_PORT..."
echo "(This database must already exist — create it first with:"
echo "  createdb --host=$DB_HOST --port=$DB_PORT --username=$DB_USERNAME $TARGET_DB)"
echo

PGPASSWORD="$DB_PASSWORD" pg_restore \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USERNAME" \
  --dbname="$TARGET_DB" \
  --clean --if-exists --no-owner --no-privileges \
  "$DUMP_FILE"

echo "✓ Restore into '$TARGET_DB' complete."
