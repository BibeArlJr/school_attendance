<?php

namespace App\Providers;

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
        //
    }
}
