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

        // super_admin is platform-level, not scoped to any single school —
        // school_id stays null per the Phase 1 users schema.
        User::updateOrCreate(
            ['email' => 'superadmin@school-erp.dev'],
            [
                'name' => 'Demo Super Admin',
                'password' => $password,
                'school_id' => null,
                'role' => UserRole::SuperAdmin,
                'email_verified_at' => now(),
            ],
        );

        User::updateOrCreate(
            ['email' => 'teacher@demo-school.edu.np'],
            [
                'name' => 'Demo Teacher',
                'password' => $password,
                'school_id' => $school->id,
                'role' => UserRole::Teacher,
                'email_verified_at' => now(),
            ],
        );

        User::updateOrCreate(
            ['email' => 'guard@demo-school.edu.np'],
            [
                'name' => 'Demo Guard',
                'password' => $password,
                'school_id' => $school->id,
                'role' => UserRole::Guard,
                'email_verified_at' => now(),
            ],
        );

        $this->command->info('Demo school and demo users seeded (all share one password):');
        $this->command->info("  Password: {$password}");
        $this->command->info('  super_admin: superadmin@school-erp.dev');
        $this->command->info('  admin:       admin@demo-school.edu.np');
        $this->command->info('  teacher:     teacher@demo-school.edu.np');
        $this->command->info('  guard:       guard@demo-school.edu.np');
    }
}
