<?php

namespace App\Modules\Staff\Services;

use App\Modules\Attendance\Models\AttendanceRecord;
use App\Modules\IdCard\Models\IdCard;
use App\Modules\IdCard\Services\IdCardService;
use App\Modules\Staff\Models\Staff;
use App\Support\Exceptions\DeleteBlockedException;
use App\Support\Services\AuditLogger;
use Illuminate\Support\Facades\DB;

/**
 * Real HR-domain personnel — no login/User involved at all (see Staff
 * model's own docblock). An ID card is auto-generated on create, same
 * as students (Part D of the rebuild prompt) — this is the one real
 * behavioral difference from the old (now UserAccount) "staff" concept,
 * which deliberately stopped generating cards once staff attendance was
 * removed; that removal is exactly what this whole module reverses.
 */
class StaffService
{
    public function __construct(
        private readonly AuditLogger $auditLogger,
        private readonly IdCardService $idCardService,
    ) {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, int $schoolId): Staff
    {
        return DB::transaction(function () use ($data, $schoolId) {
            $staff = Staff::create([
                ...$data,
                'school_id' => $schoolId,
                'employment_status' => 'active',
            ]);

            $this->idCardService->generateForStaff($staff);

            $this->auditLogger->log('staff.created', 'staff', $staff->id, null, $staff->toArray(), $schoolId);

            return $staff->fresh();
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Staff $staff, array $data): Staff
    {
        return DB::transaction(function () use ($staff, $data) {
            $before = $staff->only(array_keys($data));
            $staff->update($data);

            $this->auditLogger->log('staff.updated', 'staff', $staff->id, $before, $data, $staff->school_id);

            return $staff->fresh();
        });
    }

    public function updateEmploymentStatus(Staff $staff, string $status): Staff
    {
        $before = ['employment_status' => $staff->employment_status->value];

        $staff->update(['employment_status' => $status]);

        $this->auditLogger->log(
            'staff.employment_status_changed',
            'staff',
            $staff->id,
            $before,
            ['employment_status' => $status],
            $staff->school_id,
        );

        return $staff->fresh();
    }

    /**
     * Real delete, not a status change — only allowed with zero
     * attendance history, same safe-delete convention as every other
     * personal record in this system (Student, ParentGuardian). No
     * `users` row involved at all, so there's nothing else to clean up
     * beyond this staff row's own id_cards.
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
            $before = $staff->toArray();
            IdCard::query()->where('owner_type', 'staff')->where('owner_id', $staff->id)->delete();
            $staff->delete();

            $this->auditLogger->log('staff.deleted', 'staff', $staff->id, $before, null, $staff->school_id);
        });
    }
}
