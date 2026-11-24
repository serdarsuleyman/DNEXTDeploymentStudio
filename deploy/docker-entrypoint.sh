#!/bin/sh
# Keeps runtime state (SQLite DB, saved environments, generated TMF payloads) on the
# persistent volume at $STATE_DIR. The image contents seed the volume on first start;
# on later starts, files added by a newer image are copied in without overwriting existing ones.
set -e
STATE_DIR="${STATE_DIR:-}"
if [ -n "$STATE_DIR" ]; then
  mkdir -p "$STATE_DIR"
  for p in backend/data backend/config.json tmf_packages; do
    name=$(basename "$p")
    if [ ! -e "$STATE_DIR/$name" ]; then
      cp -a "/app/$p" "$STATE_DIR/$name"
    elif [ -d "/app/$p" ]; then
      cp -an "/app/$p/." "$STATE_DIR/$name/"
    fi
    rm -rf "/app/$p"
    ln -s "$STATE_DIR/$name" "/app/$p"
  done
fi
exec "$@"
