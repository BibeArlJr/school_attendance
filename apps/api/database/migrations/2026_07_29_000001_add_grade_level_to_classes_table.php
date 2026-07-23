<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            // Display/sort order only — never shown as the class's name.
            // Nullable: not every class name maps to a known grade (see
            // GradeLevelInference), and that's fine — unresolvable names
            // just sort after the resolved ones.
            $table->unsignedSmallInteger('grade_level')->nullable()->after('section');
        });

        // One-time backfill for the existing seeded "Grade N" classes.
        // Scoped to that exact naming pattern (not a blind digit-grep
        // across every class name) so it can't misfire on something like
        // "Room 204". The import's own word-form lookup (One/Two/...)
        // handles a different naming convention going forward — see
        // GradeLevelInference.
        foreach (DB::table('classes')->whereNull('grade_level')->get(['id', 'name']) as $class) {
            if (preg_match('/^grade\s*(\d+)$/i', trim($class->name), $matches)) {
                DB::table('classes')->where('id', $class->id)->update(['grade_level' => (int) $matches[1]]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropColumn('grade_level');
        });
    }
};
