<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('import_batches', function (Blueprint $table) {
            // e.g. [{"sheet_name": "Sheet1", "reason": "no recognizable
            // header row"}] — persisted (not just returned inline from the
            // parse response) so the review step still shows which sheets
            // were skipped and why after a page reload.
            $table->json('skipped_sheets')->nullable()->after('skipped_count');
        });
    }

    public function down(): void
    {
        Schema::table('import_batches', function (Blueprint $table) {
            $table->dropColumn('skipped_sheets');
        });
    }
};
