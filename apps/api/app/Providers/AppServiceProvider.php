<?php

namespace App\Providers;

use App\Models\User;
use App\Modules\Sms\Services\MockSmsService;
use App\Modules\Sms\Services\RealSparrowSmsService;
use App\Modules\Staff\Models\Staff;
use App\Modules\Student\Models\Student;
use App\Support\Contracts\SmsServiceInterface;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
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
        // Credentials are no longer constructor-injected here (Prompt
        // 43) — RealSparrowSmsService resolves them itself, per call,
        // from sms_provider_configs (encrypted DB storage, not env/
        // config()). "Not configured" is now a per-send outcome (logged
        // as a failed sms_logs row, never thrown — see
        // RealSparrowSmsService::send()), not a boot-time exception.
        $this->app->bind(SmsServiceInterface::class, function () {
            if (config('services.sms.driver') === 'real') {
                return new RealSparrowSmsService();
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

        // Platform Console (Prompt 24) — super_admin-only, checked
        // directly against the role, deliberately NOT generated from
        // config/modules.php: that config is the per-school module
        // matrix (ADR 0003), and the platform console sits above school
        // scoping entirely, not inside it.
        Gate::define(
            'platform-admin',
            fn (User $user): bool => $user->role->value === 'super_admin',
        );

        // IdCard/AttendanceEvent/AttendanceRecord owner_type stores these
        // short aliases, not fully-qualified class names.
        Relation::morphMap([
            'student' => Student::class,
            'staff' => Staff::class,
        ]);

        // Keyed by IP+email together (Prompt 31 Part B): IP-only would let
        // one attacker burn through attempts against many accounts just as
        // fast, email-only would let a distributed attacker bypass it
        // entirely by spreading requests across IPs.
        RateLimiter::for('login', function (Request $request): Limit {
            $key = strtolower((string) $request->input('email')).'|'.$request->ip();

            return Limit::perMinute(5)->by($key);
        });

        // Baseline for $middleware->throttleApi() in bootstrap/app.php —
        // that helper targets the 'api' limiter name by convention, so it
        // has to exist even though nothing else references it by name.
        RateLimiter::for('api', function (Request $request): Limit {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}
