<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * import_batches.uploaded_by was created with cascadeOnDelete(),
     * which would silently delete a school's entire bulk-import history
     * (an independent-value audit trail) if the uploading staff member's
     * user account is ever deleted (Prompt 11's safe-delete for Teachers).
     * Every other "who did this" FK in this schema (attendance_records.
     * modified_by, attendance_events.guard_user_id/reviewed_by,
     * classes.class_teacher_id) already uses nullOnDelete() — this
     * brings uploaded_by in line with that existing convention instead
     * of cascading.
     */
    public function up(): void
    {
        Schema::table('import_batches', function (Blueprint $table) {
            $table->dropForeign(['uploaded_by']);
        });

        Schema::table('import_batches', function (Blueprint $table) {
            $table->unsignedBigInteger('uploaded_by')->nullable()->change();
        });

        Schema::table('import_batches', function (Blueprint $table) {
            $table->foreign('uploaded_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('import_batches', function (Blueprint $table) {
            $table->dropForeign(['uploaded_by']);
        });

        Schema::table('import_batches', function (Blueprint $table) {
            $table->unsignedBigInteger('uploaded_by')->nullable(false)->change();
        });

        Schema::table('import_batches', function (Blueprint $table) {
            $table->foreign('uploaded_by')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
