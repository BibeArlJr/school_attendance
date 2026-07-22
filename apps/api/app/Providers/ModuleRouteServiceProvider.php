<?php

namespace App\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

/**
 * Autoloads every app/Modules/<Module>/routes.php file, each registered
 * under the /api prefix with the standard 'api' middleware group. Adding a
 * new module only requires dropping a routes.php file in its folder.
 */
class ModuleRouteServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(function () {
                foreach (glob(app_path('Modules/*/routes.php')) as $routes) {
                    require $routes;
                }
            });
    }
}
