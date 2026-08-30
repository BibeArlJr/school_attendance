<?php

namespace App\Modules\Users\Services;

use App\Models\User;
use App\Modules\Users\Models\UserAccount;
use App\Support\Enums\StaffEmploymentStatus;
use App\Support\Enums\UserRole;
use App\Support\Services\AuditLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Renamed from StaffService — manages admin/guard LOGIN accounts only.
 *
 * destroy() deliberately no longer checks/deletes any owner_type='staff'
 * id_cards or attendance_records by this row's id: under the Staff ->
 * Users rename, this model's id space is completely independent of the
 * new HR-domain Staff model's — a UserAccount id could coincidentally
 * collide with a real Staff member's id, and the old check/delete would
 * have silently operated on the WRONG owner's rows. UserAccount rows
 * never carry id_cards/attendance at all going forward (no ID card is
 * ever generated for a login account), so there's nothing of that kind
 * to check or clean up here anymore.
 */
class UserAccountService
{
    public function __construct(private readonly AuditLogger $auditLogger)
    {
    }

    /**
     * Creates the login (User, role=guard or admin — Prompt 26
     * generalized this from teacher-only, Prompt 34 removed teacher as a
     * creatable role entirely) and the account profile in one
     * transaction. No ID card is generated — login accounts were never
     * meant to scan in/out; that's the new HR-domain Staff model's
     * concern (App\Modules\Staff), not this one. The generated password
     * is returned once, in plain text, to the caller — it is never
     * persisted anywhere except as a hash (User::$casts hashes it on
     * save) and never appears in any later response.
     *
     * @param  array<string, mixed>  $data
     * @return array{staff: UserAccount, temporary_password: string}
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

            $account = UserAccount::create([
                'school_id' => $schoolId,
                'user_id' => $user->id,
                'designation' => $data['designation'] ?? null,
                // Explicit, not relying on the DB column default — a
                // freshly ::create()'d in-memory model doesn't get
                // server-side defaults hydrated back without a refetch.
                'employment_status' => 'active',
            ]);

            return ['staff' => $account->load('user'), 'temporary_password' => $temporaryPassword];
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(UserAccount $userAccount, array $data): UserAccount
    {
        return DB::transaction(function () use ($userAccount, $data) {
            $userAccount->update([
                'designation' => $data['designation'] ?? null,
            ]);

            $userAccount->user->update([
                'name' => $data['name'],
                'email' => $data['email'],
            ]);

            return $userAccount->fresh('user');
        });
    }

    public function updateEmploymentStatus(UserAccount $userAccount, string $status): UserAccount
    {
        return DB::transaction(function () use ($userAccount, $status) {
            $before = ['employment_status' => $userAccount->employment_status->value];

            $userAccount->update(['employment_status' => $status]);

            if ($status === StaffEmploymentStatus::Resigned->value) {
                $userAccount->user->update(['is_active' => false]);
            } elseif ($status === StaffEmploymentStatus::Active->value && ! $userAccount->user->is_active) {
                // Rehire path: reactivate login if it was previously
                // disabled by a resignation.
                $userAccount->user->update(['is_active' => true]);
            }

            $fresh = $userAccount->fresh('user');

            // Resignation blocks login (User::is_active flips false
            // above) — the single most accountability-relevant status
            // change, but every status change is logged the same way,
            // not just that one branch.
            $this->auditLogger->log(
                'user_account.employment_status_changed',
                'user_account',
                $userAccount->id,
                $before,
                ['employment_status' => $status],
                $userAccount->school_id,
            );

            return $fresh;
        });
    }

    /**
     * Same one-time-display pattern as create(): the new password is
     * returned once, in plain text, and never persisted except as a hash.
     */
    public function resetPassword(UserAccount $userAccount): string
    {
        $temporaryPassword = Str::password(12);

        $userAccount->user->update(['password' => $temporaryPassword]);

        // Who reset whose password, when — never the password itself
        // (before/after are deliberately null, not the temporary
        // password in either direction).
        $this->auditLogger->log('user_account.password_reset', 'user_account', $userAccount->id, null, null, $userAccount->school_id);

        return $temporaryPassword;
    }

    /**
     * Real delete, not a status change. class_teacher assignment is not
     * a blocking concern (Prompt 35 Part F) — classes.class_teacher_name
     * is plain text now, not an FK to this account's user row, so
     * there's nothing left to leave dangling.
     */
    public function destroy(UserAccount $userAccount): void
    {
        DB::transaction(function () use ($userAccount) {
            $before = [...$userAccount->toArray(), 'user' => $userAccount->user->only(['name', 'email', 'role'])];
            $userId = $userAccount->user_id;
            $userAccount->delete();
            // import_batches.uploaded_by, attendance_records.modified_by,
            // and attendance_events.guard_user_id/reviewed_by are all
            // nullOnDelete — deleting the user preserves those rows,
            // just clearing who did it. No other FK references users.id
            // in a way that would block or need explicit handling here.
            User::query()->where('id', $userId)->delete();

            $this->auditLogger->log('user_account.deleted', 'user_account', $userAccount->id, $before, null, $userAccount->school_id);
        });
    }
}
