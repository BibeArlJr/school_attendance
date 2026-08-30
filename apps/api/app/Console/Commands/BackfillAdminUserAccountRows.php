<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Modules\Users\Models\UserAccount;
use App\Support\Enums\StaffEmploymentStatus;
use App\Support\Enums\UserRole;
use Illuminate\Console\Command;

/**
 * Renamed from BackfillAdminStaffRows (Staff -> Users rename) and fixed
 * to match: it previously queried Staff::query()->pluck('user_id'),
 * which now targets the new HR-domain Staff model that has no user_id
 * column at all — that query would have thrown a real SQL error the
 * next time this ran. UserAccount is the actual login-account-adjacent
 * concept this command was always about.
 *
 * Backfill for a real bug: PlatformSchoolService::create() (the
 * "create school + first admin" flow) never created a matching
 * user_accounts row for the admin it creates. UserController::index()
 * queries that table directly, so every affected school's original
 * admin was a fully real, logged-in-capable account that silently
 * never appeared in its own Users list. That creation path is now fixed
 * separately — this command only backfills accounts that already exist
 * from before the fix.
 *
 * Purely additive: only ever creates a missing user_accounts row. Never
 * reads, modifies, or touches the `users` row itself — the account's
 * password and login ability are completely unaffected either way. Safe
 * to run repeatedly: an admin who already has a user_accounts row is
 * simply skipped, every time.
 */
class BackfillAdminUserAccountRows extends Command
{
    /**
     * @var string
     */
    protected $signature = 'app:backfill-admin-user-account-rows {--dry-run : Report what would be created without creating anything}';

    /**
     * @var string
     */
    protected $description = 'Creates a missing user_accounts row for any admin account created before it existed — additive only, never touches the user row.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $existingUserIds = UserAccount::query()->pluck('user_id');

        $affectedAdmins = User::query()
            ->where('role', UserRole::Admin)
            ->whereNotIn('id', $existingUserIds)
            ->with('school:id,name')
            ->get();

        foreach ($affectedAdmins as $admin) {
            $schoolName = $admin->school?->name ?? "school_id={$admin->school_id}";
            $this->line("{$schoolName} | {$admin->email}" . ($dryRun ? ' (would create user_accounts row)' : ' — creating user_accounts row'));

            if (! $dryRun) {
                UserAccount::create([
                    'school_id' => $admin->school_id,
                    'user_id' => $admin->id,
                    'designation' => null,
                    'employment_status' => StaffEmploymentStatus::Active,
                ]);
            }
        }

        $verb = $dryRun ? 'Would create' : 'Created';
        $this->info("{$verb} {$affectedAdmins->count()} missing user_accounts row(s).");

        return self::SUCCESS;
    }
}
