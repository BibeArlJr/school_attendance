<?php

// Single source of truth for module-level RBAC. Every module key here
// gets a matching `access-{key}` Gate generated in
// App\Providers\AppServiceProvider::boot() — add a module by editing this
// array, not by hand-writing a new Gate::define() call.
//
// Kept in sync manually with apps/web/src/shared/constants/modules.ts
// (frontend sidebar/route enforcement). A backend-served capabilities
// endpoint would remove this duplication — a reasonable future
// improvement, not built in this phase.
return [
    'dashboard' => ['super_admin', 'admin', 'teacher', 'guard'],
    'students' => ['super_admin', 'admin', 'teacher'],
    // Module key renamed from 'teachers' (Prompt 34 Part D) — this now
    // manages guard/admin accounts only, teacher is no longer creatable
    // here (existing teacher accounts stay, deactivated — see
    // StaffEmploymentStatus::Resigned). The allowed-viewer role list is
    // unrelated and unchanged.
    'staff' => ['super_admin', 'admin'],
    'parents' => ['super_admin', 'admin'],
    'attendance' => ['super_admin', 'admin', 'teacher', 'guard'],
    'gate-scanner' => ['super_admin', 'admin', 'guard'],
    // Widened in Phase 6 to include teacher (read-only view of the
    // Barcode/ID card list) — reissue itself stays admin/super_admin only
    // via the separate manage-students Gate, same read/write split
    // pattern Students got in Phase 4.
    'barcode' => ['super_admin', 'admin', 'teacher'],
    'sms-log' => ['super_admin', 'admin'],
    'reports' => ['super_admin', 'admin', 'teacher'],
    'settings' => ['super_admin', 'admin'],
];
