#!/bin/sh
set -e

# Hosts such as Railway mount volumes owned by root. Start as root only to hand the data
# directory to the unprivileged "node" user, then run the server as that user.
if [ "$(id -u)" = "0" ]; then
  data_dir="$(dirname "${OYLA_DB_PATH:-/data/oyla.db}")"
  mkdir -p "$data_dir"
  chown -R node:node "$data_dir"
  exec setpriv --reuid=node --regid=node --init-groups "$@"
fi

exec "$@"
