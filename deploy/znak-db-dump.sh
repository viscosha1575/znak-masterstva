#!/bin/bash
# Consistent copies of the site's two SQLite databases (applications and
# visit statistics), as a tar on stdout — for backup.py --command.
#
# The databases are live and in WAL mode, so the files are not copied as
# they lie: VACUUM INTO, run inside the admin container, writes a snapshot
# of each that is whole at one moment.
set -euo pipefail

CONTAINER=avito-uslugi-admin-1
DIR=/tmp/znak-backup-$$

docker exec "$CONTAINER" mkdir -p "$DIR"
trap 'docker exec "$CONTAINER" rm -rf "$DIR"' EXIT

docker exec -i -e DIR="$DIR" "$CONTAINER" node - >&2 <<'JS'
const { DatabaseSync } = require("node:sqlite");
for (const name of ["znak", "analytics"]) {
  const db = new DatabaseSync(`/data/${name}.db`, { timeout: 15000 });
  db.exec(`VACUUM INTO '${process.env.DIR}/${name}.db'`);
  db.close();
}
JS

docker exec "$CONTAINER" tar -C "$DIR" -cf - znak.db analytics.db
