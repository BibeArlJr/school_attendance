<?php

namespace App\Providers;

use App\Models\User;
use App\Modules\Attendance\Services\MockSmsService;
use App\Modules\Student\Models\Student;
use App\Support\Contracts\SmsServiceInterface;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * Future integrations (SMS, barcode, etc.) bind their interface from
     * App\Support\Contracts to a Mock or Real implementation here, chosen
     * by a config flag — mirrors the frontend mock-service pattern
     * documented in docs/architecture/service-pattern.md.
     */
    public function register(): void
    {
        $this->app->bind(SmsServiceInterface::class, function () {
            if (config('services.sms.driver') !== 'mock') {
                // Mirrors the frontend factory's behavior (see
                // getGateFeedService()): fail predictably rather than
                // silently doing nothing when a real driver is requested
                // but doesn't exist yet.
                throw new \RuntimeException(
                    'Real SmsService is not implemented yet — no SMS gateway integration exists. '
                    . 'Set SMS_DRIVER=mock.',
                );
            }

            return new MockSmsService();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Generates one `access-{module}` Gate per entry in
        // config/modules.php — see ADR 0003. Adding an 11th module means
        // one config-array edit, not a new Gate::define() call.
        foreach (config('modules', []) as $module => $allowedRoles) {
            Gate::define(
                "access-{$module}",
                fn (User $user): bool => in_array($user->role->value, $allowedRoles, true),
            );
        }

        // One-off write-permission Gate for Students: access-students
        // (config-generated above) governs viewing, this narrower Gate
        // governs create/update/status-change. Hand-written, not folded
        // into config/modules.php's generation — that config only has one
        // role-list per module, and this is the only module needing a
        // read/write split so far. If 3+ modules need this same split,
        // generalize the config shape then; not a call to make here.
        Gate::define(
            'manage-students',
            fn (User $user): bool => in_array($user->role->value, ['super_admin', 'admin'], true),
        );

        // Write-permission Gate for Attendance: access-attendance
        // (config-generated, all 4 staff roles) governs viewing records/
        // anomalies; this narrower Gate governs marking an anomaly
        // reviewed and manual record correction. Guards get full
        // access-attendance (they need to see today's records) but not
        // this — only admin/super_admin correct records.
        Gate::define(
            'manage-attendance',
            fn (User $user): bool => in_array($user->role->value, ['super_admin', 'admin'], true),
        );

        // IdCard.owner_type stores this short alias ('student'), not the
        // fully-qualified class name — 'staff' is reserved for a future
        // phase and deliberately left unmapped since no such model exists
        // yet (plain morphMap, not enforceMorphMap, so that's fine).
        Relation::morphMap([
            'student' => Student::class,
        ]);
    }
}
