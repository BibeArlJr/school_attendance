# ADR 0003: Static Config-Driven Role→Module Map (Not a Permissions Package)

## Status

Accepted

## Context

The product needs module-level access control: which of the five fixed
roles (`super_admin`, `admin`, `teacher`, `parent`, `guard`) can reach
which module (Dashboard, Students, Attendance, Gate Scanner, etc.). The
common off-the-shelf answer in the Laravel ecosystem is a full
roles-and-permissions package (e.g. `spatie/laravel-permission`), backed
by `roles`, `permissions`, and pivot tables, supporting many-roles-per-user
and arbitrary custom permissions assigned per user or per role at runtime.

## Decision

We use a static PHP config array (`config/modules.php`) mapping each
module key to the list of roles allowed to access it, with one Laravel
`Gate` generated per module from that array
(`App\Providers\AppServiceProvider::boot()`). No `roles`, `permissions`,
or pivot tables are introduced; the existing single `role` enum column on
`users` (from Phase 1) remains the only authorization data on the user.

## Rationale

Every user in this system has exactly one fixed role from a closed set of
five, and access control is module-level (can this role open this
section of the app at all), not row-level (can this specific teacher edit
this specific student) or user-customizable (no per-staff custom
permission grants exist in the product requirements). A full permissions
package is built to solve a harder problem than we have: many-to-many
role assignment, runtime-editable permissions, and per-user overrides —
none of which this product needs yet. Adopting one now would mean
maintaining database migrations, seeders, and a permissions-management UI
for a flexibility axis nobody has asked for, while a static config array
edited by a developer is exactly as expressive as what the product
actually requires today and is trivially versioned in git.

This is revisited when either becomes true: (a) a school needs
custom per-staff permissions that don't map to one of the five fixed
roles, or (b) access control needs to go finer than module-level (e.g.
"this teacher can only see their own assigned classes' attendance"). At
that point, the module-level Gates defined here can be layered under a
real permissions package rather than replaced — the `access-{module}`
Gate names are a stable seam either way.
