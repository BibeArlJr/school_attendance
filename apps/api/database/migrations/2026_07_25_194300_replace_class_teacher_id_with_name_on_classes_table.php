<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->string('class_teacher_name')->nullable()->after('section');
        });

        // Snapshot whatever the FK currently points at as plain text
        // before dropping it — not asked for explicitly, but the
        // obviously-correct thing to do rather than silently discarding
        // a value that was visibly set (Prompt 35 Part F: class_teacher_id
        // is a broken reference going forward since Teacher accounts no
        // longer exist, not that any currently-set value is meaningless).
        DB::statement(
            'UPDATE classes SET class_teacher_name = users.name '
            . 'FROM users WHERE classes.class_teacher_id = users.id',
        );

        Schema::table('classes', function (Blueprint $table) {
            $table->dropForeign(['class_teacher_id']);
            $table->dropColumn('class_teacher_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->foreignId('class_teacher_id')->nullable()->after('section')->constrained('users')->nullOnDelete();
            $table->dropColumn('class_teacher_name');
        });
    }
};
