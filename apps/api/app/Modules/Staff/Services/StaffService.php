<?php

namespace App\Modules\Staff\Services;

use App\Models\User;
use App\Modules\IdCard\Services\IdCardService;
use App\Modules\Staff\Models\Staff;
use App\Support\Enums\StaffEmploymentStatus;
use App\Support\Enums\UserRole;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StaffService
{
    public function __construct(private readonly IdCardService $idCardService)
    {
    }

    /**
     * Creates the login (User, role=teacher) and the staff profile in one
     * transaction, plus an ID card. The generated password is returned
     * once, in plain text, to the caller — it is never persisted anywhere
     * except as a hash (User::$casts hashes it on save) and never appears
     * in any later response.
     *
     * @param  array<string, mixed>  $data
     * @return array{staff: Staff, temporary_password: string}
     */
    public function create(array $data, int $schoolId): array
    {
        return DB::transaction(function () use ($data, $schoolId) {
            $temporaryPassword = Str::password(12);

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $temporaryPassword,
                'school_id' => $schoolId,
                'role' => UserRole::Teacher,
                'email_verified_at' => now(),
            ]);

            $staff = Staff::create([
                'school_id' => $schoolId,
                'user_id' => $user->id,
                'designation' => $data['designation'],
                'qualification' => $data['qualification'] ?? null,
                'joined_date' => $data['joined_date'],
                // Explicit, not relying on the DB column default — a
                // freshly ::create()'d in-memory model doesn't get
                // server-side defaults hydrated back without a refetch.
                'employment_status' => 'active',
            ]);

            $this->idCardService->generateForStaff($staff);

            return ['staff' => $staff->load('user'), 'temporary_password' => $temporaryPassword];
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Staff $staff, array $data): Staff
    {
        return DB::transaction(function () use ($staff, $data) {
            $staff->update([
                'designation' => $data['designation'],
                'qualification' => $data['qualification'] ?? null,
                'joined_date' => $data['joined_date'],
            ]);

            $staff->user->update([
                'name' => $data['name'],
                'email' => $data['email'],
            ]);

            return $staff->fresh('user');
        });
    }

    public function updateEmploymentStatus(Staff $staff, string $status): Staff
    {
        return DB::transaction(function () use ($staff, $status) {
            $staff->update(['employment_status' => $status]);

            if ($status === StaffEmploymentStatus::Resigned->value) {
                $staff->user->update(['is_active' => false]);
            } elseif ($status === StaffEmploymentStatus::Active->value && ! $staff->user->is_active) {
                // Rehire path: reactivate login if it was previously
                // disabled by a resignation.
                $staff->user->update(['is_active' => true]);
            }

            return $staff->fresh('user');
        });
    }

    /**
     * Same one-time-display pattern as create(): the new password is
     * returned once, in plain text, and never persisted except as a hash.
     */
    public function resetPassword(Staff $staff): string
    {
        $temporaryPassword = Str::password(12);

        $staff->user->update(['password' => $temporaryPassword]);

        return $temporaryPassword;
    }
}
