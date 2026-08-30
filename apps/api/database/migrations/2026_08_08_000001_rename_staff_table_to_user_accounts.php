<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Frees up the `staff` table name for a new, independent HR-domain
 * `staff` table (personnel records, no user_id/login capability) —
 * this existing table only ever backed admin/guard LOGIN accounts
 * (school_id/user_id/designation/employment_status), so it's renamed
 * to reflect what it actually is: extra profile data for a User
 * account, not "staff" in the personnel sense. Same reasoning as the
 * "Staff" page's own rename to "Users".
 *
 * Schema::rename() only renames the table itself — every auto-named
 * Postgres constraint/index/sequence (staff_pkey, staff_uuid_unique,
 * staff_id_seq, etc.) keeps its old staff_* name and would otherwise
 * collide the moment a NEW `staff` table tries to create its own
 * identically-auto-named constraints (confirmed live: this exact
 * collision happened on first attempt — "relation staff_uuid_unique
 * already exists" — before these explicit renames were added).
 */
return new class () extends Migration {
    public function up(): void
    {
        Schema::rename('staff', 'user_accounts');

        DB::statement('ALTER TABLE user_accounts RENAME CONSTRAINT staff_pkey TO user_accounts_pkey');
        DB::statement('ALTER TABLE user_accounts RENAME CONSTRAINT staff_user_id_unique TO user_accounts_user_id_unique');
        DB::statement('ALTER TABLE user_accounts RENAME CONSTRAINT staff_uuid_unique TO user_accounts_uuid_unique');
        DB::statement('ALTER TABLE user_accounts RENAME CONSTRAINT staff_school_id_foreign TO user_accounts_school_id_foreign');
        DB::statement('ALTER TABLE user_accounts RENAME CONSTRAINT staff_user_id_foreign TO user_accounts_user_id_foreign');
        DB::statement('ALTER SEQUENCE staff_id_seq RENAME TO user_accounts_id_seq');
    }

    public function down(): void
    {
        DB::statement('ALTER SEQUENCE user_accounts_id_seq RENAME TO staff_id_seq');
        DB::statement('ALTER TABLE user_accounts RENAME CONSTRAINT user_accounts_user_id_foreign TO staff_user_id_foreign');
        DB::statement('ALTER TABLE user_accounts RENAME CONSTRAINT user_accounts_school_id_foreign TO staff_school_id_foreign');
        DB::statement('ALTER TABLE user_accounts RENAME CONSTRAINT user_accounts_uuid_unique TO staff_uuid_unique');
        DB::statement('ALTER TABLE user_accounts RENAME CONSTRAINT user_accounts_user_id_unique TO staff_user_id_unique');
        DB::statement('ALTER TABLE user_accounts RENAME CONSTRAINT user_accounts_pkey TO staff_pkey');

        Schema::rename('user_accounts', 'staff');
    }
};
