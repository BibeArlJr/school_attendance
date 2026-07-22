<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\School\Models\School;
use App\Support\Enums\UserRole;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::firstOrCreate(
            ['slug' => 'demo-school'],
            [
                'name' => 'Demo School',
                'primary_color' => '#2563EB',
            ],
        );

        $password = 'Demo@Passw0rd';

        User::updateOrCreate(
            ['email' => 'admin@demo-school.edu.np'],
            [
                'name' => 'Demo Admin',
                'password' => $password,
                'school_id' => $school->id,
                'role' => UserRole::Admin,
                'email_verified_at' => now(),
            ],
        );

        $this->command->info('Demo school and admin user seeded.');
        $this->command->info('  Email:    admin@demo-school.edu.np');
        $this->command->info("  Password: {$password}");
    }
}
