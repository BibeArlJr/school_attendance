<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\Enums\UserRole;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

/**
 * Production first-boot bootstrap (Prompt 55 Part A). DemoSeeder creates
 * a super_admin too, but also a demo school, demo students, and other
 * throwaway test data — never appropriate to run against a real
 * production database. This command is the production-safe equivalent:
 * it creates exactly one row (a super_admin User, school_id null per the
 * Phase 1 schema) and nothing else. Safe to run more than once — refuses
 * rather than creating a second super_admin by accident.
 */
class CreateSuperAdmin extends Command
{
    /**
     * @var string
     */
    protected $signature = 'app:create-super-admin';

    /**
     * @var string
     */
    protected $description = 'Create the first platform super_admin account (production first-boot only — creates no other data).';

    public function handle(): int
    {
        if (User::query()->where('role', UserRole::SuperAdmin)->exists()) {
            $this->error('A super_admin account already exists. This command only creates the first one.');

            return self::FAILURE;
        }

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

        $this->info("Super admin account created: {$email}");

        return self::SUCCESS;
    }
}
