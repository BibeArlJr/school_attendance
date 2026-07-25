<?php

namespace App\Modules\Staff\Services;

use App\Models\User;
use App\Modules\Attendance\Models\AttendanceRecord;
use App\Modules\IdCard\Models\IdCard;
use App\Modules\Staff\Models\Staff;
use App\Support\Enums\StaffEmploymentStatus;
use App\Support\Enums\UserRole;
use App\Support\Exceptions\DeleteBlockedException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StaffService
{
    /**
     * Creates the login (User, role=guard or admin — Prompt 26
     * generalized this from teacher-only, Prompt 34 removed teacher as a
     * creatable role entirely) and the staff profile in one transaction.
     * No ID card is generated (Prompt 34 Part C — staff no longer scan
     * in/out, so there's nothing for a card to be used for). The
     * generated password is returned once, in plain text, to the caller
     * — it is never persisted anywhere except as a hash (User::$casts
     * hashes it on save) and never appears in any later response.
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
                'role' => UserRole::from($data['role']),
                'email_verified_at' => now(),
            ]);

            $staff = Staff::create([
                'school_id' => $schoolId,
                'user_id' => $user->id,
                'designation' => $data['designation'] ?? null,
                // Explicit, not relying on the DB column default — a
                // freshly ::create()'d in-memory model doesn't get
                // server-side defaults hydrated back without a refetch.
                'employment_status' => 'active',
            ]);

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
                'designation' => $data['designation'] ?? null,
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

    /**
     * Real delete, not a status change — only allowed with zero
     * attendance history. class_teacher assignment is no longer a
     * blocking concern (Prompt 35 Part F) — classes.class_teacher_name
     * is plain text now, not an FK to this staff member's user row, so
     * there's nothing left to leave dangling.
     */
    public function destroy(Staff $staff): void
    {
        $hasAttendance = AttendanceRecord::query()
            ->where('owner_type', 'staff')
            ->where('owner_id', $staff->id)
            ->exists();

        if ($hasAttendance) {
            throw new DeleteBlockedException(
                'Cannot delete: this staff member has attendance history. Use the employment status menu instead.',
            );
        }

        DB::transaction(function () use ($staff) {
            IdCard::query()->where('owner_type', 'staff')->where('owner_id', $staff->id)->delete();
            $userId = $staff->user_id;
            $staff->delete();
            // import_batches.uploaded_by, attendance_records.modified_by,
            // and attendance_events.guard_user_id/reviewed_by are all
            // nullOnDelete — deleting the user preserves those rows,
            // just clearing who did it. No other FK references users.id
            // in a way that would block or need explicit handling here.
            User::query()->where('id', $userId)->delete();
        });
    }
}
