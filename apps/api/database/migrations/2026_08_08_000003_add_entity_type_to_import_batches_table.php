<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * import_batches/import_batch_rows are reused as-is for the new staff
 * import (Part H of the rebuild-staff prompt) — this is the one real
 * schema gap that reuse needs: nothing previously distinguished which
 * kind of entity a batch's rows resolve to. Defaults to 'student' so
 * every batch created before this migration (100% of them, since staff
 * import didn't exist yet) is correctly backfilled without a separate
 * data migration.
 */
return new class () extends Migration {
    public function up(): void
    {
        Schema::table('import_batches', function (Blueprint $table) {
            $table->string('entity_type')->default('student')->after('file_name');
        });
    }

    public function down(): void
    {
        Schema::table('import_batches', function (Blueprint $table) {
            $table->dropColumn('entity_type');
        });
    }
};
