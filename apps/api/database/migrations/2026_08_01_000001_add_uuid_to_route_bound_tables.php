<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Route-facing identity for Students/Staff/Parents/Classes (Prompt 16) —
 * the internal auto-increment `id` stays untouched for FKs/joins; `uuid`
 * is only what a `{model}` route parameter resolves against from here on
 * (see App\Support\Concerns\HasUuidRouteKey). Left nullable at the DB
 * level rather than adding a NOT NULL constraint via ->change(), which
 * would require doctrine/dbal — every row is backfilled here, and the
 * model's creating hook guarantees one going forward, so NULL never
 * actually occurs in practice; the unique index is what really matters.
 */
return new class () extends Migration {
    private const TABLES = ['students', 'staff', 'parent_guardians', 'classes'];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->uuid('uuid')->nullable()->after('id');
            });

            DB::table($table)->whereNull('uuid')->orderBy('id')->select('id')->cursor()->each(
                fn ($row) => DB::table($table)->where('id', $row->id)->update(['uuid' => (string) Str::uuid()]),
            );

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->unique('uuid');
            });
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                $blueprint->dropUnique("{$table}_uuid_unique");
                $blueprint->dropColumn('uuid');
            });
        }
    }
};
