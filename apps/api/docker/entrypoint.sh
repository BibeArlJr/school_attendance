#!/bin/sh
set -eu

# Render assigns PORT at runtime (defaults to 10000 if unset) — nginx's
# config file can't read env vars directly, so the listen directive is
# templated in at container start, not baked in at build time.
export PORT="${PORT:-10000}"
envsubst '${PORT}' < /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf

# Standard Laravel production performance practice (Prompt 55 Part E).
# Deliberately NOT run at Docker build time: Render only injects real
# env vars (DB_URL, APP_KEY, etc.) into the running container, not the
# build step, so a build-time config:cache would bake in build-time
# nulls/defaults instead of the real production values. Runs here, at
# container start, once per container — the ephemeral filesystem means
# there's never a stale cache left over from a previous run to clear
# first.
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec "$@"
