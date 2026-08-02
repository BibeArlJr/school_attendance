<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Guarded (Prompt 55 audit): this is Laravel's default entry point —
     * `php artisan db:seed` / `migrate --seed` with no further arguments
     * calls this class specifically. Without the environment check,
     * running either of those against a real production database by
     * mistake would inject the demo school, demo students, and demo
     * admin credentials (Demo@Passw0rd) into it. Production's first-boot
     * path is `php artisan app:create-super-admin` (CreateSuperAdmin),
     * which this never touches.
     */
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->command?->error('DemoSeeder only runs in local/testing environments — refusing to seed demo data here.');

            return;
        }

        $this->call(DemoSeeder::class);
    }
}
