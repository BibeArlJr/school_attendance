<?php

namespace App\Modules\Platform\Services;

use App\Models\User;
use App\Modules\School\Models\School;
use App\Support\Enums\UserRole;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PlatformSchoolService
{
    /**
     * Creates the school and its first admin login (role=admin — this
     * codebase has no separate "school_admin" enum case; `admin` already
     * is the school-scoped administrator role, distinct from the
     * platform-level `super_admin`) in one transaction. The generated
     * password is returned once, in plain text — same one-time-reveal
     * pattern as StaffService::create() (Prompt 8), not reinvented here.
     *
     * @param  array<string, mixed>  $data
     * @return array{school: School, admin: User, temporary_password: string}
     */
    public function create(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $school = new School([
                'name' => $data['name'],
                'slug' => $this->uniqueSlug($data['name']),
                'contact_email' => $data['contact_email'] ?? null,
                'contact_phone' => $data['contact_phone'] ?? null,
            ]);
            // school_code is deliberately never mass-assignable (not in
            // School::$fillable) — set directly here, the one place a
            // school is ever created, so there is no other path that
            // could set or change it later.
            $school->school_code = $data['school_code'];
            $school->save();

            $temporaryPassword = Str::password(12);

            $admin = User::create([
                'name' => $data['admin_name'],
                'email' => $data['admin_email'],
                'password' => $temporaryPassword,
                'school_id' => $school->id,
                'role' => UserRole::Admin,
                'email_verified_at' => now(),
            ]);

            return ['school' => $school, 'admin' => $admin, 'temporary_password' => $temporaryPassword];
        });
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 1;

        while (School::query()->where('slug', $slug)->exists()) {
            $suffix++;
            $slug = "{$base}-{$suffix}";
        }

        return $slug;
    }
}
