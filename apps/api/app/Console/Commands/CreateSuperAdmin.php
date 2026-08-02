<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\Enums\UserRole;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * Production first-boot bootstrap (Prompt 55 Part A; extended for
 * unattended container-boot use in the wrong-DB-host-diagnostic
 * follow-up prompt). DemoSeeder creates a super_admin too, but also a
 * demo school, demo students, and other throwaway test data — never
 * appropriate to run against a real production database. This command
 * is the production-safe equivalent: it creates exactly one row (a
 * super_admin User, school_id null per the Phase 1 schema) and nothing
 * else. Safe to run on every container boot — skips (not errors) once
 * a super_admin already exists, so it never blocks a redeploy.
 *
 * Two modes:
 * - Interactive (a human running this by hand, e.g. locally): prompts
 *   for name/email/password as before.
 * - `--no-interaction` (Render's entrypoint.sh, every boot — there is
 *   no stdin/TTY at container start, so the interactive prompts would
 *   otherwise hang forever): auto-generates a random password and uses
 *   SUPER_ADMIN_EMAIL/SUPER_ADMIN_NAME env vars (with defaults) instead
 *   of asking, then prints the one-time credentials in a hard-to-miss
 *   banner — the only way to retrieve them without Shell access, since
 *   Render's free tier only offers the Logs tab.
 */
class CreateSuperAdmin extends Command
{
    /**
     * @var string
     */
    protected $signature = 'app:create-super-admin {--email=} {--name=}';

    /**
     * @var string
     */
    protected $description = 'Create the first platform super_admin account (production first-boot only — creates no other data).';

    public function handle(): int
    {
        if (User::query()->where('role', UserRole::SuperAdmin)->exists()) {
            // SUCCESS, not FAILURE: this is the expected, steady-state
            // outcome on every boot after the first — entrypoint.sh runs
            // with `set -eu`, so a non-zero exit here would fail every
            // subsequent container boot/redeploy, not just a redundant
            // manual invocation.
            $this->info('A super_admin account already exists — skipping.');

            return self::SUCCESS;
        }

        if ($this->option('no-interaction')) {
            return $this->createUnattended();
        }

        return $this->createInteractive();
    }

    private function createInteractive(): int
    {
        $name = $this->ask('Super admin name');
        $email = $this->ask('Super admin email');
        $password = $this->secret('Super admin password (min 8 characters)');
        $passwordConfirmation = $this->secret('Confirm password');

        $validator = Validator::make(
            [
                'name' => $name,
                'email' => $email,
                'password' => $password,
                'password_confirmation' => $passwordConfirmation,
            ],
            [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'max:255', 'unique:users,email'],
                'password' => ['required', 'string', 'min:8', 'confirmed'],
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }

            return self::FAILURE;
        }

        $this->createSuperAdmin($name, $email, $password);
        $this->info("Super admin account created: {$email}");

        return self::SUCCESS;
    }

    /**
     * No prompts, no stdin read at all — every value either comes from
     * a CLI option/env var or is generated. A genuine failure here
     * (e.g. the resolved email somehow already belongs to a
     * non-super_admin user) is allowed to throw/exit non-zero on
     * purpose: that's a real problem worth failing the deploy over, not
     * a case to silently swallow like the already-exists skip above.
     */
    private function createUnattended(): int
    {
        $name = $this->option('name') ?: 'Super Admin';
        $email = $this->option('email') ?: $this->defaultEmail();
        $password = Str::password(20);

        $this->createSuperAdmin($name, $email, $password);

        $banner = str_repeat('=', 62);
        $this->line($banner);
        $this->line('  SUPER ADMIN ACCOUNT CREATED — SAVE THESE CREDENTIALS NOW');
        $this->line($banner);
        $this->line("  Email:    {$email}");
        $this->line("  Password: {$password}");
        $this->line($banner);
        $this->line('  This password is shown here ONCE and is not stored anywhere');
        $this->line('  in plain text. If lost, reset it directly against the');
        $this->line('  production database (e.g. via a one-off tinker command).');
        $this->line($banner);

        return self::SUCCESS;
    }

    private function createSuperAdmin(string $name, string $email, string $password): void
    {
        // school_id stays null — super_admin is platform-level, not
        // scoped to any single school (same convention as DemoSeeder).
        User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'school_id' => null,
            'role' => UserRole::SuperAdmin,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
    }

    /**
     * SUPER_ADMIN_EMAIL is optional — most operators will just let this
     * default kick in, derived from APP_URL's host so it's at least
     * recognizable as "this deployment's" super admin rather than a
     * meaningless placeholder.
     */
    private function defaultEmail(): string
    {
        $host = parse_url((string) config('app.url'), PHP_URL_HOST);

        return env('SUPER_ADMIN_EMAIL', 'superadmin@' . ($host ?: 'change-me.local'));
    }
}
