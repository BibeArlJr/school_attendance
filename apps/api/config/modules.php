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
    'teachers' => ['super_admin', 'admin'],
    'parents' => ['super_admin', 'admin'],
    'attendance' => ['super_admin', 'admin', 'teacher', 'guard'],
    'gate-scanner' => ['super_admin', 'admin', 'guard'],
    'barcode' => ['super_admin', 'admin'],
    'sms-log' => ['super_admin', 'admin'],
    'reports' => ['super_admin', 'admin', 'teacher'],
    'settings' => ['super_admin', 'admin'],
];
