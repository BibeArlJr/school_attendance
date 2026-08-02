# Deployment: Vercel + Render + Neon

Prompt 55. This is the specific 3-service split this project is prepared
for — Vercel (frontend, `apps/web`), Render (backend, `apps/api`, via
Docker), Neon (managed Postgres). Not a generic "how to deploy Laravel"
guide; every recommendation below is scoped to this exact stack.

## Prerequisites — first-boot data

Never run `DemoSeeder` against a real production database — it creates
a demo school, demo students, and other throwaway data alongside the
super_admin account, which is fine for local dev but wrong for
production. Instead, once migrations have run against the real
database:

```
php artisan app:create-super-admin
```

This prompts for a name/email/password and creates exactly one row (a
`super_admin` User, `school_id` null) — nothing else. It refuses to run
a second time once a super_admin already exists, so it's safe to leave
in the deploy pipeline rather than needing to remember to remove it.

## Security incident (Prompt 55 pre-deployment audit): rotated APP_KEY

A pre-deployment git-history audit found that `apps/api/.env.testing`
(intentionally git-tracked — see its own `.gitignore` exception) had, by
mistake, the exact same `APP_KEY` as the real local dev `.env`
(gitignored, never itself committed) — meaning the actual key
encrypting real Sparrow SMS credentials in `sms_provider_configs` was
sitting in git history on a public GitHub repo. Both keys have been
rotated to fresh, distinct values, and the real credentials re-encrypted
under the new dev key (verified: still decrypts, and a real Sparrow
credit-balance check still succeeds). **This is exactly why**
`apps/api/.env.production.example`'s `APP_KEY` guidance says to generate
a brand-new key for production rather than reuse dev's — do not copy
dev's `.env` wholesale when setting up Render.

The old key value still exists in this repo's git history (rotating it
going forward doesn't erase that) — a full history rewrite
(`git filter-repo` or BFG) would remove it entirely but requires a
force-push and isn't done here; it's a deliberate call for whoever owns
this repo to make, given the disruption (breaks any existing
clones/forks). Rotating the actual Sparrow API token via Sparrow's own
dashboard is a cheap additional precaution worth taking regardless.

## Part C — Render (backend)

**PHP is not a Render native runtime.** Render's native runtimes are
Node.js/Bun, Python, Ruby, Go, Rust, and Elixir only — confirmed via
Render's own docs, not assumed. PHP apps deploy via Docker there, which
is what `apps/api/Dockerfile` is for: a single container running nginx
+ php-fpm under `supervisord`, built on `php:8.4-fpm-alpine`.

This image has been built and run locally (not just written and hoped
to work):

- `docker build` succeeds with all required extensions
  (`pdo_pgsql`, `pgsql`, `gd`, `zip`, `bcmath`, `intl`, `opcache` —
  phpoffice/phpspreadsheet's real requirements, not guessed) loading
  cleanly.
- Running the container against this project's real local Postgres
  database, `GET /api/health` returns `200 {"status":"ok"}`.
- `php artisan migrate:status` inside the running container shows every
  migration applied correctly.

**render.yaml** (repo root) defines the one web service:

- `runtime: docker`, `dockerfilePath`/`dockerContext`: `apps/api`
  (this is a monorepo — Render's monorepo support needs these paths
  relative to the repo root, confirmed via Render's docs).
- `healthCheckPath: /api/health` — Render's own liveness check, distinct
  from Laravel's built-in `GET /up` (which never touches the database —
  see `HealthController`'s docblock).
- `preDeployCommand: php artisan migrate --force` — runs once per
  deploy, after the image builds and before the new instance takes
  traffic. **Never** `migrate:fresh` here — that drops every table in
  the real production database.
- `envVars` with `sync: false` for anything secret — fill those in via
  the Render dashboard's Environment tab using
  `apps/api/.env.production.example` as the reference, not by editing
  `render.yaml` itself.

**Performance caching (Prompt 55 audit Part E):** `apps/api/docker/entrypoint.sh`
runs `php artisan config:cache`, `route:cache`, and `view:cache` —
standard Laravel production practice. Deliberately **not** run at Docker
build time: Render only injects real env vars into the running
container, not the build step, so a build-time `config:cache` would bake
in build-time nulls instead of real production values. Runs at container
*start* instead, once per container, verified locally: rebuilt the image
with this change, confirmed all three cache commands succeed, and
re-ran the same `/api/health` (200) and planted-`.php`-file (403) checks
against the cached, running container to confirm caching didn't
silently break routing or config resolution.

### Hardening: does Prompt 41's concern carry over?

**No, not as-is — Render's Docker/nginx setup needs its own version of
the same protection.** Prompt 41's mitigation was an `.htaccess` file
under `storage/app/public/` denying PHP execution — that's an
Apache-specific mechanism (`mod_php`, `<FilesMatch>`), and **nginx never
reads `.htaccess` files at all.** Left alone, that file would simply do
nothing on Render.

The equivalent protection is in `apps/api/docker/nginx.conf.template`:
only `= /index.php` (the front controller) is ever routed to php-fpm;
a catch-all `location ~ \.php$ { deny all; }` rejects every other `.php`
request outright. This is actually **stronger** than the original
Apache mitigation, which only covered the one upload directory — here,
nothing outside `index.php` can ever execute as PHP, full stop,
regardless of where it landed.

Verified for real, not just read: after starting the container, a file
named `test-exploit.php` was planted directly under
`public/storage/` (the exact directory Prompt 41 was worried about) and
requested over HTTP. Result: `403`, not code execution.

### Free tier reality

Render's free web-service tier spins down after 15 minutes of
inactivity and takes 30–60 seconds to cold-start back up on the next
request. See Part G below for the keep-alive mitigation, and its
honest limits.

## Part D — Vercel (frontend)

`apps/web/vercel.json`:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Verified locally: `npm run build` (the exact command above) succeeds
and produces `dist/index.html`, `dist/assets/`, `dist/branding/` — the
same output Vercel's build step will produce.

**One dashboard setting `vercel.json` cannot express:** in the Vercel
project's own Settings → General, set **Root Directory** to `apps/web`.
There is no `rootDirectory` key in `vercel.json` — Vercel's own schema
doesn't have one; this is a Project Settings field, not a config file
field (confirmed via Vercel's docs, not assumed).

The `rewrites` rule is needed because this app uses
`createBrowserRouter` (real browser History API routing, not hash
routing) — without it, a hard refresh on e.g. `/students` would 404
instead of serving `index.html` and letting React Router take over.

**Where the Render backend's URL gets injected:** `VITE_API_URL` is a
Vite build-time var (`apiClient.ts`, `authApi.ts` both read
`import.meta.env.VITE_API_URL`) — set it in Vercel's dashboard
(Project Settings → Environment Variables, scoped to Production) to the
deployed Render URL + `/api`, e.g.
`https://school-attendance-api.onrender.com/api`. See
`apps/web/.env.production.example` for the complete list, including a
real, verified gotcha: `VITE_USE_MOCK_NOTIFICATIONS` must stay `true` in
production — the real `NotificationService` doesn't exist yet, and
flipping this throws at dashboard-mount time.

## Part E — Scheduled tasks on Render

**Render's Cron Jobs are not free-tier eligible** — they start at
$1/mo, billed per minute (confirmed via Render's own pricing pages, not
assumed). The free workaround built here:

1. A new protected endpoint, `POST /api/tasks/send-license-reminders`
   (guarded by `VerifyScheduledTaskSecret` — a shared secret sent as an
   `X-Scheduled-Task-Secret` header, rejected with 401 whenever the
   secret isn't configured or doesn't match `hash_equals`). This wraps
   the existing `app:send-license-reminders` command (Prompt 33) — no
   new business logic, just an HTTP-triggerable entry point.
2. `.github/workflows/scheduled-tasks.yml` — a GitHub Actions scheduled
   workflow (`cron: '0 2 * * *'`, daily) that `curl`s that endpoint.
   This repo is public on GitHub, so Actions minutes are unlimited/free
   regardless — a cleaner fit than a third-party cron-ping service,
   since it's already available given this repo's real GitHub remote.
   An external cron-ping service (cron-job.org, EasyCron) hitting the
   same endpoint the same way is an equally valid fallback if GitHub
   Actions is ever unavailable.

Setup (one-time): generate a secret (`openssl rand -hex 32`), set it as
`SCHEDULED_TASK_SECRET` on the Render service AND as the
`SCHEDULED_TASK_SECRET` repository secret in GitHub (Settings → Secrets
and variables → Actions), plus a `RENDER_API_URL` repository *variable*
(not secret — it's not sensitive) with the deployed backend's base URL.

## Part G — Keep-alive (mitigating free-tier cold starts)

Not implemented server-side — this is external service configuration,
documented here rather than built into the app:

Configure a free uptime monitor (UptimeRobot's free tier — 50 monitors,
5-minute interval — is a reasonable choice) to `GET` the existing
`GET /api/health` endpoint every 5–14 minutes. This endpoint already
exists (Prompt 45), needs no auth, and genuinely checks the database
connection rather than just confirming the process is alive.

**Honest caveat:** this may not fully prevent the free tier's 15-minute
spin-down, depending on Render's current policy — Render has changed
this behavior before (the spin-down window was previously 30 minutes,
now 15) and could again. Treat this as a mitigation, not a guarantee,
for anything where cold starts matter. The reliable fix is the paid
`starter` plan ($7/mo), which removes spin-down entirely — a real
option worth considering for a live school's attendance system where a
30–60 second delay on the first gate scan of the morning is a real cost.

## Part F — Backups (Neon)

See `docs/operations/backup-strategy.md`, updated for Neon's actual
managed-Postgres reality rather than the local-VPS assumption it was
originally written under.

## GitHub remote status (as of this prompt)

This project already has a real, configured GitHub remote —
`origin` → `https://github.com/BibeArlJr/school_attendance.git` — and
it is NOT unpushed history sitting only locally, contrary to this
prompt's own ROLE section, which assumed it had never been pushed.
`git ls-remote origin` shows `main` on the remote at commit `09ba0ac`
("Edit Student: Roll No/Address/Guardian parity with Add; remove Gender
from Add"). The local branch is 6 commits ahead of that as of this
prompt's own commit, meaning a real range of already-completed work
(everything after that commit, including this prompt's deployment prep)
exists only locally and has not yet been pushed. Reported here rather
than assumed either way, since the ROLE section asked for that
confirmation explicitly. Pushing those commits is a separate, explicit
decision for whoever owns this repository to make — not done
automatically as part of this prompt.
