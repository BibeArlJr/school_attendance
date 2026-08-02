#!/bin/sh
set -eu

# Render assigns PORT at runtime (defaults to 10000 if unset) — nginx's
# config file can't read env vars directly, so the listen directive is
# templated in at container start, not baked in at build time.
export PORT="${PORT:-10000}"
envsubst '${PORT}' < /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf

exec "$@"
