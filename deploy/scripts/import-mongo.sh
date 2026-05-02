#!/usr/bin/env bash
# Restore a mongodump archive (produced by export-mongo.sh) into the
# running compose stack's mongo service.
#
#   ./import-mongo.sh ./mongo-dump.archive
#
# The script copies the archive into the mongo container, restores it
# into the database named in deploy/.env (DB_NAME), and rewrites the
# original DB name to the new one in case you renamed it (the preview
# defaults to "test_database").
set -euo pipefail

ARCHIVE="${1:?usage: import-mongo.sh <archive>}"
[ -f "${ARCHIVE}" ] || { echo "archive not found: ${ARCHIVE}" >&2; exit 1; }

# Source deploy/.env for DB_NAME. Resolves relative to this script.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"
if [ -f "${ENV_FILE}" ]; then
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
fi
TARGET_DB="${DB_NAME:-design_workshop}"
SOURCE_DB="${SOURCE_DB:-test_database}"

# Find the right docker compose file (parent of deploy/).
COMPOSE_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "${COMPOSE_DIR}"

# Verify mongo container is up.
if ! docker compose ps mongo --status running --quiet | grep -q .; then
  echo "ERROR: mongo service isn't running. Start the stack first: docker compose up -d mongo" >&2
  exit 1
fi

CONTAINER_PATH="/tmp/$(basename "${ARCHIVE}")"
echo "Copying archive into mongo container..."
docker compose cp "${ARCHIVE}" "mongo:${CONTAINER_PATH}"

echo "Restoring ${SOURCE_DB} -> ${TARGET_DB}..."
docker compose exec -T mongo mongorestore \
  --archive="${CONTAINER_PATH}" \
  --gzip \
  --nsFrom="${SOURCE_DB}.*" \
  --nsTo="${TARGET_DB}.*" \
  --drop

echo "Cleaning up temp archive in container..."
docker compose exec -T mongo rm -f "${CONTAINER_PATH}"

echo "Done. Now run migrate-uploads.py to copy uploaded files."
