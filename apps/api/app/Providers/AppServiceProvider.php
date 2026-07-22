<?php

namespace App\Providers;

use App\Models\User;
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
     * documented in docs/architecture/service-pattern.md. No bindings
     * exist yet in Phase 1.
     */
    public function register(): void
    {
        //
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
    }
}
