#!/usr/bin/env bash
# Dumps the full application database to a timestamped, compressed file
# (Prompt 45 Part E). Reads connection details from apps/api/.env so this
# always backs up whichever database the API is actually configured
# against, rather than a hardcoded name.
#
# Usage: scripts/backup-db.sh [output-dir]
#   output-dir defaults to ./backups (created if missing).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_ROOT/apps/api/.env"
OUTPUT_DIR="${1:-$REPO_ROOT/backups}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "✖ Could not find $ENV_FILE" >&2
  exit 1
fi

# Only the DB_* lines, so a stray APP_KEY or other value with a `#` or
# quote in it can't corrupt this shell's environment.
db_env() {
  grep -E "^${1}=" "$ENV_FILE" | tail -n1 | cut -d '=' -f2-
}

DB_HOST=$(db_env DB_HOST)
DB_PORT=$(db_env DB_PORT)
DB_DATABASE=$(db_env DB_DATABASE)
DB_USERNAME=$(db_env DB_USERNAME)
DB_PASSWORD=$(db_env DB_PASSWORD)

mkdir -p "$OUTPUT_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="$OUTPUT_DIR/${DB_DATABASE}_${TIMESTAMP}.dump"

echo "Backing up database '$DB_DATABASE' from $DB_HOST:$DB_PORT..."

PGPASSWORD="$DB_PASSWORD" pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USERNAME" \
  --format=custom \
  --file="$DUMP_FILE" \
  "$DB_DATABASE"

echo "✓ Backup written to $DUMP_FILE ($(du -h "$DUMP_FILE" | cut -f1))"
