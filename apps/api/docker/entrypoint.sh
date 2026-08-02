#!/bin/sh
set -eu

# Render assigns PORT at runtime (defaults to 10000 if unset) — nginx's
# config file can't read env vars directly, so the listen directive is
# templated in at container start, not baked in at build time.
export PORT="${PORT:-10000}"
envsubst '${PORT}' < /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf

# Render's free tier has no Shell access — this is the only place
# one-off commands like migrations and first-boot bootstrap can run at
# all. Runs before config/route/view caching below, since nothing else
# should touch the database on a half-migrated schema.
#
# Both are safe to run on every single boot/redeploy, not just the
# first: `migrate --force` tracks applied migrations in its own
# `migrations` table and skips ones already run (verified: a second run
# against an already-migrated database is a clean no-op). Also
# deliberately redundant with render.yaml's own
# `preDeployCommand: php artisan migrate --force` — that command's
# instance doesn't share this container's local filesystem (the same
# reason config:cache below has to run here and not there), but
# migrations write to the external Neon database, not local disk, so
# running it in both places is harmless double-coverage, not a
# meaningful duplication of effort. It also makes plain `docker run`
# testing self-contained without needing to simulate preDeployCommand
# separately.
#
# app:create-super-admin --no-interaction: no stdin/TTY exists at
# container boot, so the command's interactive prompts (used for manual
# local runs) would hang forever without --no-interaction. The command
# itself refuses — safely, by returning success rather than erroring —
# once a super_admin already exists, so redeploys after the first never
# create a duplicate or fail the boot.
php artisan migrate --force
php artisan app:create-super-admin --no-interaction

# Standard Laravel production performance practice (Prompt 55 Part E).
# Deliberately NOT run at Docker build time: Render only injects real
# env vars (DB_URL, APP_KEY, etc.) into the running container, not the
# build step, so a build-time config:cache would bake in build-time
# nulls/defaults instead of the real production values. Runs here, at
# container start, once per container.
#
# config:clear runs first explicitly (diagnostic prompt, wrong-DB-host
# investigation): `config:cache` alone already self-clears internally
# before rebuilding — verified empirically by deliberately baking a
# stale config.php with wrong DB values into a test image and
# confirming `config:cache` still produced fresh, correct values from
# the real environment — so this wasn't the actual bug. Kept explicit
# anyway as cheap, unambiguous defense-in-depth against relying on that
# internal behavior.
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec "$@"
