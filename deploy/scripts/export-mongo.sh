#!/usr/bin/env bash
# Dump the preview MongoDB into a single archive file you can scp to the
# Proxmox box. Run this INSIDE the source environment (the preview pod).
#
#   ./export-mongo.sh                 # writes ./mongo-dump.archive
#   ./export-mongo.sh /tmp/dw.archive # custom path
#
# The archive is the raw `mongodump --archive` format; restore it with
# import-mongo.sh on the destination host.
set -euo pipefail

OUT_PATH="${1:-./mongo-dump.archive}"
SRC_URI="${MONGO_URL:-mongodb://localhost:27017}"
SRC_DB="${DB_NAME:-test_database}"

if ! command -v mongodump >/dev/null 2>&1; then
  echo "ERROR: mongodump not found. Install mongo-tools first." >&2
  exit 1
fi

echo "Dumping ${SRC_DB} from ${SRC_URI} -> ${OUT_PATH}"
mongodump \
  --uri="${SRC_URI}" \
  --db="${SRC_DB}" \
  --archive="${OUT_PATH}" \
  --gzip

echo "Done. scp this file to the Proxmox host, then run import-mongo.sh."
