# Backup Strategy

Prompt 45 Part E. This documents the backup/recovery plan for the deployed
application. The mechanism itself (`scripts/backup-db.sh` /
`scripts/restore-db.sh`) is real and has been tested against the current
dev database — see "Verification" below.

## What needs backing up

1. **The PostgreSQL database** — all application data (students, staff,
   attendance records, audit logs, users, schools, everything). This is
   the primary and most critical backup target.
2. **Uploaded school logo files** — stored on the `public` disk under
   `storage/app/public/logos/{school_id}/` (see
   `SettingsController::uploadLogo()`). These are **not** in the
   database — only the resulting public URL is (`schools.logo_url`).
   A database-only backup restores every school with its logo URL
   pointing at a file that no longer exists. Back up
   `storage/app/public/logos/` (or wherever that disk is mounted in
   production) alongside the database, on the same schedule.

Nothing else in `storage/` currently holds durable user data worth a
separate backup policy — application logs and cache are regenerable.

## Recommended frequency and retention

- **Frequency:** daily, once deployed. A school's attendance data changes
  every school day, so daily is the right granularity for how much data
  a worst-case restore could lose (up to one day).
- **Retention:** keep 7 daily backups + 4 weekly backups (one from each
  of the last 4 Sundays, say) + 3 monthly backups. This gives same-week
  granularity for the recent past and a longer safety net without
  keeping every daily backup forever. Adjust once real usage patterns
  and storage costs are known — this is a starting point, not a
  permanent number.

## Where backups must be stored

**Off the server the database runs on.** A backup that lives on the same
disk as the database it backs up doesn't protect against the most likely
real failure modes: disk failure, accidental `rm`, the server itself
being lost or compromised. This needs to go to object storage (e.g. AWS
S3, Cloudflare R2, or equivalent) in a different location/account than
the app server, ideally with versioning or a retention policy configured
on the bucket itself as a second line of defense against a backup job
that starts silently uploading corrupt dumps.

Provisioning that bucket and the upload step is **not done as part of
this prompt** — it depends on where the app is actually deployed. What's
required, concretely, once a deployment target is chosen:

1. An object storage bucket the app server can write to (credentials
   scoped to write-only/put, ideally — the app server shouldn't need
   delete or read access to old backups).
2. A cron job (or equivalent scheduler) on the production server that
   runs `scripts/backup-db.sh`, then uploads the resulting `.dump` file
   to that bucket, then deletes the local copy (don't accumulate dumps
   on the app server itself).
3. The logo directory backed up the same way — either synced to the
   same bucket on the same schedule, or covered by the storage
   provider's own snapshot/versioning if logos live directly in object
   storage rather than local disk in production (recommended for a real
   deployment regardless of backups, since local disk on an app server
   is usually ephemeral).

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
