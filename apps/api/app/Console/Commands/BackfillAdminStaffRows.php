<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Modules\Staff\Models\Staff;
use App\Support\Enums\StaffEmploymentStatus;
use App\Support\Enums\UserRole;
use Illuminate\Console\Command;

/**
 * Backfill for a real bug: PlatformSchoolService::create() (the
 * "create school + first admin" flow, predating Staff Management —
 * Prompt 8) never created a matching `staff` row for the admin it
 * creates. StaffController::index() queries the `staff` table directly,
 * so every affected school's original admin was a fully real,
 * logged-in-capable account that silently never appeared in its own
 * Staff Management list. That creation path is now fixed separately —
 * this command only backfills accounts that already exist from before
 * the fix.
 *
 * Purely additive: only ever creates a missing `staff` row. Never reads,
 * modifies, or touches the `users` row itself — the account's password
 * and login ability are completely unaffected either way. Safe to run
 * repeatedly: an admin who already has a `staff` row is simply skipped,
 * every time.
 */
class BackfillAdminStaffRows extends Command
{
    /**
     * @var string
     */
    protected $signature = 'app:backfill-admin-staff-rows {--dry-run : Report what would be created without creating anything}';

    /**
     * @var string
     */
    protected $description = 'Creates a missing staff row for any admin account created before Staff Management existed — additive only, never touches the user row.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $staffUserIds = Staff::query()->pluck('user_id');

        $affectedAdmins = User::query()
            ->where('role', UserRole::Admin)
            ->whereNotIn('id', $staffUserIds)
            ->with('school:id,name')
            ->get();

        foreach ($affectedAdmins as $admin) {
            $schoolName = $admin->school?->name ?? "school_id={$admin->school_id}";
            $this->line("{$schoolName} | {$admin->email}" . ($dryRun ? ' (would create staff row)' : ' — creating staff row'));

            if (! $dryRun) {
                Staff::create([
                    'school_id' => $admin->school_id,
                    'user_id' => $admin->id,
                    'designation' => null,
                    'employment_status' => StaffEmploymentStatus::Active,
                ]);
            }
        }

        $verb = $dryRun ? 'Would create' : 'Created';
        $this->info("{$verb} {$affectedAdmins->count()} missing staff row(s).");

        return self::SUCCESS;
    }
}
