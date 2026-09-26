<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Flat historical summary row, created only once an import is actually
 * confirmed (Bulk SMS module, contact-management stage) — not a
 * workflow-state table like import_batches. There is no "rows" table
 * alongside this: the preview step (BulkSmsUploadController::preview())
 * writes nothing at all, and confirm() inserts bulk_sms_contacts rows
 * directly in the same request that creates this summary row. No
 * school_id — this module is platform-level, independent of any school's
 * data (see BulkSmsContact's own migration for the same reasoning).
 */
return new class () extends Migration {
    public function up(): void
    {
        Schema::create('bulk_sms_uploads', function (Blueprint $table) {
            $table->id();
            $table->string('file_name');
            // nullOnDelete, not cascade — same reasoning as import_batches.
            // uploaded_by (Prompt 11's safe-delete precedent): this
            // history row is an independent-value audit trail that must
            // survive the uploading admin's account being deleted later.
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('uploaded_at');
            $table->unsignedInteger('total_rows')->default(0);
            $table->unsignedInteger('imported_count')->default(0);
            $table->unsignedInteger('skipped_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bulk_sms_uploads');
    }
};
