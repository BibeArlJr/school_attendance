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
        $email = $this->resolveEmail($this->option('email'));
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
     * Real incident: this used to return `superadmin@{$host}` unvalidated,
     * trusting parse_url()'s output blindly. When APP_URL was never set
     * on Render, config('app.url') silently fell back to Laravel's own
     * default (config/app.php: env('APP_URL', 'http://localhost')),
     * parse_url() extracted the bare host "localhost", and the result —
     * superadmin@localhost — has no TLD and is syntactically invalid.
     * Nothing caught it at creation time because this path never
     * validated its own output at all (unlike createInteractive()'s
     * Validator call above). Laravel's default 'email' rule is ALSO not
     * strict enough to have caught this even if it had been checked —
     * it uses RFC validation, which accepts a bare single-label host as
     * technically valid — so this explicitly uses 'email:filter'
     * (PHP's filter_var, confirmed empirically to reject
     * "superadmin@localhost" and accept a real domain) rather than
     * Laravel's default.
     *
     * @param  string|null  $option  --email=, if explicitly passed
     */
    private function resolveEmail(?string $option): string
    {
        $candidate = $option ?: env('SUPER_ADMIN_EMAIL');

        if (! $candidate) {
            $host = parse_url((string) config('app.url'), PHP_URL_HOST);
            $candidate = 'superadmin@' . ($host ?: 'change-me.example');
        }

        $isValid = Validator::make(['email' => $candidate], ['email' => ['email:filter']])->passes();

        // change-me.example (RFC 2606 — a TLD reserved specifically for
        // documentation/placeholder use, guaranteed not to belong to
        // anyone) rather than silently using an invalid address: an
        // operator who sees this in the boot logs immediately knows to
        // set SUPER_ADMIN_EMAIL/--email explicitly, instead of getting
        // an account they can't actually log into.
        return $isValid ? $candidate : 'superadmin@change-me.example';
    }
}
