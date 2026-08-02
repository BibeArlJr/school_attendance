# Backup Strategy

Prompt 45 Part E, updated by Prompt 55 Part F. This documents the
backup/recovery plan for the deployed application. The mechanism itself
(`scripts/backup-db.sh` / `scripts/restore-db.sh`) is real and has been
tested against the current dev database — see "Verification" below.

## Update (Prompt 55): this project's actual deployment target is Neon

Everything below this note was written under a local-VPS assumption —
"where backups must be stored" being an object storage bucket the app
server itself uploads to, on a cron job running on that same server.
That assumption no longer holds: this project's real database is
**Neon** (a managed Postgres platform), not a self-hosted Postgres
instance on a VPS the app server has shell access to. Neon manages its
own storage and backup infrastructure; there is no app-server disk to
`pg_dump` from on a schedule in the way this doc originally described.

**What Neon's free tier actually provides** (researched for this
prompt, not assumed):

- **Point-in-time recovery (PITR): 6 hours of write-ahead log history**
  on the Free plan. This means Neon can restore the database to any
  point within the last 6 hours — a real, continuous, managed
  capability, not something this project needs to build. Paid tiers
  extend this: 7 days on Launch, 30 days on Scale (billed at
  $0.20/GB-month of data changes beyond that).
- This 6-hour window is Neon's own managed-backup story — it exists
  regardless of whether `scripts/backup-db.sh` ever runs, and requires
  no cron job, no object storage bucket, and no credentials the app
  server needs to hold.

**What this means for this project's backup posture:**

1. **PITR covers the "oops, bad migration / bad data / accidental
   delete in the last few hours" case** — the most common real-world
   recovery scenario — for free, with zero additional setup. This is
   strictly better coverage than this doc's original daily-dump plan
   for anything within that 6-hour window.
2. **PITR does NOT cover "Neon account gets suspended/deleted" or "I
   want a backup I can move to a different provider."** For that, an
   independent, exported copy of the data is still worth having
   periodically — `scripts/backup-db.sh` still works exactly as
   written against Neon (it's real Postgres; the script only needs
   `DB_HOST`/`DB_PORT`/`DB_DATABASE`/`DB_USERNAME`/`DB_PASSWORD` from
   `apps/api/.env`, which for Neon come from parsing the connection
   string Neon's dashboard provides) — it just can't run *on* the app
   server anymore, since Render's app server is also not a place with
   persistent disk or a real cron scheduler on the free tier (see
   `docs/operations/deployment.md` Part E). Run it manually, on demand,
   from any machine with `pg_dump` and network access to Neon (e.g.
   locally, exactly as tested below) whenever an independent
   off-Neon copy is wanted — monthly is a reasonable cadence given
   PITR already covers the short-term case.
3. **Uploaded school logo files** are unaffected by any of the above —
   Neon backs up the database, not the app server's filesystem. The
   original guidance below (back these up separately, ideally to object
   storage rather than local disk) still applies, and is now sharper:
   see `apps/api/.env.production.example`'s note on this — logo uploads
   currently hardcode the local `public` disk in
   `SettingsController::uploadLogo()`, which is ephemeral on Render and
   not yet wired to persistent object storage at all.

The rest of this document (frequency/retention recommendations,
recovery procedure, the dump/restore verification) still describes a
real, working mechanism — kept below for the "independent off-Neon
copy" use case in point 2 above, not as the primary backup story
anymore. PITR is.

## What needs backing up

1. **The PostgreSQL database** — all application data (students, staff,
   attendance records, audit logs, users, schools, everything). This is
   the primary and most critical backup target.
2. **Uploaded school logo files** — stored on the `public` disk under
   `storage/app/public/logos/{school_id}/` (see
   `SettingsController::uploadLogo()`). These are **not** in the
   database — only the resulting public URL is (`schools.logo_url`).
   A database-only backup (or Neon's own PITR) restores every school
   with its logo URL pointing at a file that no longer exists.
   **Current real gap, not yet resolved:** in production, this disk is
   Render's ephemeral container filesystem — logos don't survive a
   redeploy at all, backed up or not (see
   `apps/api/.env.production.example`'s note on this). Fixing that
   (routing uploads through the already-scaffolded `s3` disk instead)
   is a real follow-up, not done here — it touches upload/URL/delete
   logic and needs verification against a real bucket.

Nothing else in `storage/` currently holds durable user data worth a
separate backup policy — application logs and cache are regenerable.

## Recommended frequency and retention

**Superseded by Neon's PITR for anything within the last 6 hours** (see
the Prompt 55 update above) — the guidance below now applies only to
the independent, off-Neon export (point 2 in that update), not to the
primary recovery path.

- **Frequency:** monthly is reasonable for the independent export, given
  PITR already covers the short-term/accidental-mistake case for free.
  A school's attendance data changing daily no longer drives this
  number the way it did under the original local-VPS plan — Neon's own
  retention (6h free / 7d Launch / 30d Scale) is what actually protects
  against day-to-day mistakes now.
- **Retention:** keep the last 3–6 monthly exports. This is a
  disaster/portability safety net (Neon account lost, migrating to a
  different provider), not the primary recovery mechanism — adjust once
  real usage and storage costs are known.

## Where the independent export must be stored

**Off Neon, in a different account/location** — the entire point of
this export is surviving a Neon-account-level problem, so storing it in
another Neon database or anywhere tied to the same account defeats the
purpose. Object storage (e.g. Cloudflare R2, AWS S3) in a separate
account is the right target, with the bucket's own versioning/retention
as a second line of defense against a backup job silently uploading a
corrupt dump.

Concretely, since there's no long-lived app server to run a cron job on
(Render's free-tier container is ephemeral and has no persistent disk —
see `docs/operations/deployment.md` Part E for how scheduled tasks work
here at all):

1. Run `scripts/backup-db.sh` from any machine with `pg_dump` and
   network access to Neon's connection string — a developer's own
   machine (as tested below) or a one-off GitHub Actions workflow run
   on a monthly schedule are both reasonable; the current setup doesn't
   automate this, by design (a monthly manual/reviewed export is
   proportionate to what PITR already covers day-to-day).
2. Upload the resulting `.dump` file to the object storage bucket, then
   delete the local copy — don't accumulate dumps wherever the script
   happened to run.
3. Logo files (see below) are a separate, currently-unresolved gap —
   not yet backed up anywhere, because they're not yet in durable
   storage at all in production (see the note under "What needs backing
   up").

## Recovery procedure

Using the scripts in `scripts/`:

1. **Get the backup file.** In production, download the relevant
   `.dump` file from the object storage bucket. In dev, it's already
   local (`backups/` by default, or wherever `backup-db.sh` was pointed).

2. **Create the target database** (if restoring into a fresh database
   rather than overwriting the existing one):
   ```
   createdb --host=<DB_HOST> --port=<DB_PORT> --username=<DB_USERNAME> <target_db_name>
   ```

3. **Run the restore:**
   ```
   scripts/restore-db.sh <dump-file> [target-database-name]
   ```
   Omitting `target-database-name` restores into the database currently
   configured in `apps/api/.env` (`DB_DATABASE`) — use this for an actual
   disaster recovery where the goal is restoring the real database in
   place. Pass an explicit different name to restore into a scratch
   database instead (for verification, or recovering a single table by
   hand without touching the live database).

4. **Restore the logo files** (production only — dev doesn't need this
   since the dump/restore test below didn't touch local disk): copy the
   backed-up `logos/` directory back to
   `storage/app/public/logos/` on the app server (or the equivalent path
   in whatever object storage serves that disk in production).

5. **Verify:** spot-check row counts on a few key tables (`students`,
   `attendance_records`, `audit_logs`) against what's expected, and load
   the app to confirm login and a few pages work against the restored
   data.

## Verification (this session, dev environment)

Ran against the real current dev database (`school_erp`) to confirm the
mechanism actually works, not just in theory:

1. `scripts/backup-db.sh` — dumped `school_erp` to a timestamped
   `.dump` file in `backups/`.
2. Created a fresh, empty temporary database (`school_erp_restore_test`).
3. `scripts/restore-db.sh <dump-file> school_erp_restore_test` — restored
   the dump into it.
4. Compared row counts between the original and the restored database:

   | Table               | Original | Restored | Match |
   |----------------------|---------:|---------:|:-----:|
   | students             |      402 |      402 |  ✓    |
   | attendance_records   |       17 |       17 |  ✓    |
   | audit_logs           |       14 |       14 |  ✓    |

5. Dropped the temporary database afterward.

This confirms the dump/restore mechanism works correctly today, in this
environment, with real data — not just that the scripts run without
error.
