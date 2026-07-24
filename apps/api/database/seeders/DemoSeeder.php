<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Attendance\Models\AttendanceEvent;
use App\Modules\Attendance\Models\GateDevice;
use App\Modules\Attendance\Models\SchoolCalendar;
use App\Modules\Attendance\Models\SchoolConfig;
use App\Modules\Attendance\Services\AttendanceService;
use App\Modules\IdCard\Models\IdCard;
use App\Modules\IdCard\Services\IdCardService;
use App\Modules\ParentGuardian\Models\ParentGuardian;
use App\Modules\ParentGuardian\Services\ParentGuardianLinkService;
use App\Modules\School\Models\AcademicYear;
use App\Modules\School\Models\School;
use App\Modules\School\Models\SchoolClass;
use App\Modules\Staff\Models\Staff;
use App\Modules\Student\Models\Student;
use App\Modules\Student\Services\StudentService;
use App\Support\Enums\UserRole;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::firstOrCreate(
            ['slug' => 'demo-school'],
            [
                'name' => 'Demo School',
                'primary_color' => '#2563EB',
                // Only reached on a genuinely fresh install — an existing
                // demo school (as in this dev DB) was already backfilled
                // by the add_school_code_to_schools_table migration.
                'school_code' => 'SCH001',
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

        $teacher = User::updateOrCreate(
            ['email' => 'teacher@demo-school.edu.np'],
            [
                'name' => 'Demo Teacher',
                'password' => $password,
                'school_id' => $school->id,
                'role' => UserRole::Teacher,
                'email_verified_at' => now(),
            ],
        );

        $guard = User::updateOrCreate(
            ['email' => 'guard@demo-school.edu.np'],
            [
                'name' => 'Demo Guard',
                'password' => $password,
                'school_id' => $school->id,
                'role' => UserRole::Guard,
                'email_verified_at' => now(),
            ],
        );

        // Permanent QA accounts (Prompt 22) — deliberately obvious names so
        // nobody mistakes these for a real staff member in any list or
        // report. Kept distinct from the "Demo Teacher"/"Demo Guard"
        // accounts above: those are for demoing the product, these are for
        // testing it.
        $qaTeacher = User::updateOrCreate(
            ['email' => 'qa.teacher@demo-school.edu.np'],
            [
                'name' => 'QA Test Teacher',
                'password' => $password,
                'school_id' => $school->id,
                'role' => UserRole::Teacher,
                'email_verified_at' => now(),
            ],
        );

        User::updateOrCreate(
            ['email' => 'qa.guard@demo-school.edu.np'],
            [
                'name' => 'QA Test Guard',
                'password' => $password,
                'school_id' => $school->id,
                'role' => UserRole::Guard,
                'email_verified_at' => now(),
            ],
        );

        $academicYear = AcademicYear::firstOrCreate(
            ['school_id' => $school->id, 'label' => '2026-2027'],
            [
                'start_date' => '2026-04-14',
                'end_date' => '2027-04-13',
                'is_current' => true,
            ],
        );

        $classDefs = [
            ['name' => 'Grade 1', 'section' => 'A', 'class_teacher_id' => $teacher->id],
            ['name' => 'Grade 1', 'section' => 'B', 'class_teacher_id' => null],
            ['name' => 'Grade 2', 'section' => 'A', 'class_teacher_id' => null],
            ['name' => 'Grade 3', 'section' => 'A', 'class_teacher_id' => null],
        ];

        $classes = collect($classDefs)->map(
            fn (array $def) => SchoolClass::firstOrCreate(
                [
                    'school_id' => $school->id,
                    'academic_year_id' => $academicYear->id,
                    'name' => $def['name'],
                    'section' => $def['section'],
                ],
                ['class_teacher_id' => $def['class_teacher_id']],
            ),
        )->values();

        $this->seedStudents($school->id, $classes);
        $this->seedStaff($school, $teacher, $qaTeacher);

        // Fetch in creation order (id ascending) so indices line up with
        // the $names array in seedStudents() below, regardless of whether
        // this run just created them or they already existed.
        $students = Student::query()->where('school_id', $school->id)->orderBy('id')->get();
        $this->seedParents($school->id, $students);
        $this->seedIdCards($students);
        $this->seedAttendance($school, $students, $guard);

        $this->command->info('Demo school and demo users seeded (all share one password):');
        $this->command->info("  Password: {$password}");
        $this->command->info('  super_admin: superadmin@school-erp.dev');
        $this->command->info('  admin:       admin@demo-school.edu.np');
        $this->command->info('  teacher:     teacher@demo-school.edu.np');
        $this->command->info('  guard:       guard@demo-school.edu.np');
        $this->command->info('  qa teacher (test-only): qa.teacher@demo-school.edu.np');
        $this->command->info('  qa guard (test-only):   qa.guard@demo-school.edu.np');
    }

    /**
     * @param  Collection<int, SchoolClass>  $classes
     */
    private function seedStudents(int $schoolId, Collection $classes): void
    {
        if (Student::query()->where('school_id', $schoolId)->exists()) {
            $this->command->info('Demo students already seeded, skipping.');

            return;
        }

        $studentService = app(StudentService::class);

        $names = [
            ['Aarav', 'Sharma', 'male'], ['Priya', 'Thapa', 'female'], ['Bibek', 'Gurung', 'male'],
            ['Sita', 'Rai', 'female'], ['Nabin', 'Shrestha', 'male'], ['Anjali', 'Poudel', 'female'],
            ['Rohan', 'Karki', 'male'], ['Sabina', 'Magar', 'female'], ['Suraj', 'Adhikari', 'male'],
            ['Kritika', 'Basnet', 'female'], ['Dipesh', 'Tamang', 'male'], ['Nisha', 'Lama', 'female'],
            ['Prakash', 'Bhattarai', 'male'], ['Manisha', 'Chettri', 'female'], ['Sandeep', 'Rana', 'male'],
            ['Puja', 'Khadka', 'female'], ['Bishal', 'Neupane', 'male'], ['Sunita', 'Dahal', 'female'],
        ];

        // Mostly active, with a handful of other statuses so status
        // filtering has something real to filter on.
        $statuses = [
            'active', 'active', 'active', 'active', 'active', 'active', 'active',
            'active', 'active', 'active', 'active', 'active', 'active', 'active',
            'inactive', 'transferred', 'alumni', 'active',
        ];

        foreach ($names as $index => [$firstName, $lastName, $gender]) {
            $class = $classes[$index % $classes->count()];
            $ageYears = 6 + ($index % 6);

            $student = $studentService->create([
                'class_id' => $class->id,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'dob' => now()->subYears($ageYears)->subDays($index)->toDateString(),
                'gender' => $gender,
                'admission_date' => now()->subMonths(($index % 12) + 1)->toDateString(),
            ], $schoolId);

            $status = $statuses[$index] ?? 'active';
            if ($status !== 'active') {
                $studentService->updateStatus($student, $status);
            }
        }

        $this->command->info(sprintf('Seeded %d demo students across %d classes.', count($names), $classes->count()));
    }

    /**
     * @param  Collection<int, Student>  $students
     */
    private function seedParents(int $schoolId, Collection $students): void
    {
        if (ParentGuardian::query()->where('school_id', $schoolId)->exists()) {
            $this->command->info('Demo parents already seeded, skipping.');

            return;
        }

        $linkService = app(ParentGuardianLinkService::class);

        // Indices match seedStudents()'s $names array order (both queried
        // by id ascending). Not every student gets a guardian — leaving
        // several unlinked is realistic and gives the "no guardians yet"
        // empty state something to actually show.
        [$aarav, $priya, $bibek, $sita, $nabin, $anjali, $rohan, $sabina] = [
            $students[0], $students[1], $students[2], $students[3],
            $students[4], $students[5], $students[6], $students[7],
        ];
        $kritika = $students[9];

        $ramSharmaLink = $linkService->link($aarav, [
            'name' => 'Ram Sharma',
            'phone' => '9800000001',
            'email' => 'ram.sharma@example.com',
            'relation' => 'father',
            'is_primary_contact' => true,
        ], $schoolId);

        // The sibling-dedupe case: Bibek Gurung links to the SAME parent
        // record just created above (by parent_id, not by re-creating a
        // new one), deliberately across a different surname — this is
        // demonstrating the linking mechanism, not a literal same-surname
        // family.
        $linkService->link($bibek, [
            'parent_id' => $ramSharmaLink->parent_id,
            'relation' => 'father',
            'is_primary_contact' => true,
        ], $schoolId);

        $linkService->link($priya, [
            'name' => 'Gita Thapa',
            'phone' => '9800000002',
            'email' => null,
            'relation' => 'mother',
            'is_primary_contact' => true,
        ], $schoolId);

        $linkService->link($sita, [
            'name' => 'Hari Rai',
            'phone' => '9800000003',
            'email' => null,
            'relation' => 'guardian',
            'is_primary_contact' => true,
        ], $schoolId);

        // Nabin gets two guardians — father and mother — with only the
        // father marked primary, to demonstrate a student with more than
        // one linked guardian and a non-primary contact.
        $linkService->link($nabin, [
            'name' => 'Suresh Shrestha',
            'phone' => '9800000004',
            'email' => null,
            'relation' => 'father',
            'is_primary_contact' => true,
        ], $schoolId);

        $linkService->link($nabin, [
            'name' => 'Maya Shrestha',
            'phone' => '9800000005',
            'email' => null,
            'relation' => 'mother',
            'is_primary_contact' => false,
        ], $schoolId);

        $linkService->link($anjali, [
            'name' => 'Krishna Poudel',
            'phone' => '9800000006',
            'email' => null,
            'relation' => 'father',
            'is_primary_contact' => true,
        ], $schoolId);

        $linkService->link($rohan, [
            'name' => 'Sabita Karki',
            'phone' => '9800000007',
            'email' => null,
            'relation' => 'mother',
            'is_primary_contact' => true,
        ], $schoolId);

        // 'other' relation type, to vary the enum values used across the seed.
        $linkService->link($sabina, [
            'name' => 'Tek Magar',
            'phone' => '9800000008',
            'email' => null,
            'relation' => 'other',
            'is_primary_contact' => true,
        ], $schoolId);

        $linkService->link($kritika, [
            'name' => 'Radha Basnet',
            'phone' => '9800000009',
            'email' => null,
            'relation' => 'mother',
            'is_primary_contact' => true,
        ], $schoolId);

        $this->command->info(
            'Seeded 9 demo parent/guardian contacts, including one sibling case (Ram Sharma -> Aarav & Bibek).',
        );
    }

    /**
     * One-time backfill for the 18 students seeded before StudentService
     * started auto-generating a card on creation (Phase 6) — any student
     * created from here on already gets one via that hook. Idempotent:
     * skips students that already have an active card.
     *
     * @param  Collection<int, Student>  $students
     */
    private function seedIdCards(Collection $students): void
    {
        $idCardService = app(IdCardService::class);
        $created = 0;

        foreach ($students as $student) {
            $hasActiveCard = IdCard::query()
                ->where('owner_type', 'student')
                ->where('owner_id', $student->id)
                ->where('status', 'active')
                ->exists();

            if ($hasActiveCard) {
                continue;
            }

            $idCardService->generateForStudent($student);
            $created++;
        }

        if ($created > 0) {
            $this->command->info("Backfilled {$created} ID card(s) for students created before Phase 6.");
        } else {
            $this->command->info('All students already have an active ID card, skipping backfill.');
        }
    }

    /**
     * @param  Collection<int, Student>  $students
     */
    private function seedAttendance(School $school, Collection $students, User $guard): void
    {
        SchoolConfig::query()->updateOrCreate(
            ['school_id' => $school->id],
            [
                'start_time' => '08:00:00',
                'end_time' => '15:30:00',
                'late_threshold_minutes' => 15,
                'early_departure_threshold_minutes' => 30,
                'duplicate_scan_window_seconds' => 30,
                // 0=Sun..6=Sat — Nepal's school week is Sun-Fri, Saturday off.
                'working_days' => [0, 1, 2, 3, 4, 5],
            ],
        );

        $gateDevice = GateDevice::query()->firstOrCreate(
            ['school_id' => $school->id, 'name' => 'Main Gate'],
        );

        SchoolCalendar::query()->firstOrCreate(
            ['school_id' => $school->id, 'date' => now()->addDays(5)->toDateString()],
            ['day_type' => 'holiday', 'label' => 'Demo Holiday'],
        );

        SchoolCalendar::query()->firstOrCreate(
            ['school_id' => $school->id, 'date' => now()->addDays(9)->toDateString()],
            ['day_type' => 'half_day', 'label' => 'Demo Half Day', 'half_day_end_time' => '12:00:00'],
        );

        if (AttendanceEvent::query()->where('school_id', $school->id)->whereDate('scanned_at', now()->toDateString())->exists()) {
            $this->command->info('Today\'s demo attendance already seeded, skipping.');

            return;
        }

        $attendanceService = app(AttendanceService::class);

        // [studentIndex, inTime, outTime|null] — indices match
        // seedStudents()'s $names array order. A couple of students (8, 9)
        // are deliberately left out entirely: genuinely absent, no record.
        $pattern = [
            [0, '07:50:00', '15:35:00'], // Aarav Sharma — on time
            [1, '07:55:00', '15:40:00'], // Priya Thapa — on time
            [2, '08:25:00', '15:30:00'], // Bibek Gurung — late arrival
            [3, '07:45:00', '14:50:00'], // Sita Rai — early departure
            [4, '08:05:00', null],        // Nabin Shrestha — still at school
            [5, '07:58:00', '15:32:00'], // Anjali Poudel — on time
            [6, '08:30:00', null],        // Rohan Karki — late, still at school
            [9, '07:52:00', '15:36:00'], // Kritika Basnet — on time
            // indices 7 (Sabina Magar) and 8 (Suraj Adhikari) intentionally
            // skipped — genuinely absent, no attendance_event/record at all.
        ];

        $today = now()->toDateString();

        foreach ($pattern as [$index, $inTime, $outTime]) {
            $student = $students[$index];
            $card = IdCard::query()
                ->where('owner_type', 'student')->where('owner_id', $student->id)
                ->where('status', 'active')->first();

            if (! $card) {
                continue;
            }

            Carbon::setTestNow(Carbon::parse("{$today} {$inTime}"));
            $attendanceService->processScan($school->id, $card->barcode_value, $gateDevice->id, $guard->id);

            if ($outTime !== null) {
                Carbon::setTestNow(Carbon::parse("{$today} {$outTime}"));
                $attendanceService->processScan($school->id, $card->barcode_value, $gateDevice->id, $guard->id);
            }
        }

        // One seeded anomaly for demo realism — an unknown barcode scan —
        // so the Anomaly Review UI isn't empty on first load.
        Carbon::setTestNow(Carbon::parse("{$today} 08:10:00"));
        $attendanceService->processScan($school->id, 'UNKNOWN-BARCODE-0000', $gateDevice->id, $guard->id);

        Carbon::setTestNow();

        $this->command->info(sprintf(
            'Seeded today\'s demo attendance: %d students scanned, 2 genuinely absent, 1 unknown-barcode anomaly.',
            count($pattern),
        ));
    }

    /**
     * Backfills a staff profile + ID card for the Demo Teacher (an
     * existing User from Phase 1, seeded before the staff table existed),
     * plus one additional on-leave demo teacher so the class
     * teacher-picker has something real to filter out, plus the QA Test
     * Teacher's profile (Prompt 22) — obviously-synthetic designation so
     * it reads as a test account, not a real hire, in the Teachers list.
     */
    private function seedStaff(School $school, User $teacher, User $qaTeacher): void
    {
        if (Staff::query()->where('user_id', $teacher->id)->exists()) {
            $this->command->info('Demo staff already seeded, skipping.');

            return;
        }

        $idCardService = app(IdCardService::class);

        $staff = Staff::create([
            'school_id' => $school->id,
            'user_id' => $teacher->id,
            'designation' => 'Class Teacher',
            'qualification' => 'B.Ed.',
            'joined_date' => now()->subYears(2)->toDateString(),
            'employment_status' => 'active',
        ]);
        $idCardService->generateForStaff($staff);

        $onLeaveUser = User::updateOrCreate(
            ['email' => 'teacher2@demo-school.edu.np'],
            [
                'name' => 'Sunita Rana',
                'password' => 'Demo@Passw0rd',
                'school_id' => $school->id,
                'role' => UserRole::Teacher,
                'email_verified_at' => now(),
            ],
        );
        $onLeaveStaff = Staff::create([
            'school_id' => $school->id,
            'user_id' => $onLeaveUser->id,
            'designation' => 'Subject Teacher',
            'qualification' => 'M.Ed.',
            'joined_date' => now()->subYear()->toDateString(),
            'employment_status' => 'on_leave',
        ]);
        $idCardService->generateForStaff($onLeaveStaff);

        $qaStaff = Staff::create([
            'school_id' => $school->id,
            'user_id' => $qaTeacher->id,
            'designation' => 'QA Test Account — Not A Real Employee',
            'qualification' => 'N/A',
            'joined_date' => now()->toDateString(),
            'employment_status' => 'active',
        ]);
        $idCardService->generateForStaff($qaStaff);

        $this->command->info('Seeded 2 demo staff profiles (1 active, 1 on-leave) with ID cards, plus the QA Test Teacher profile.');
    }
}
