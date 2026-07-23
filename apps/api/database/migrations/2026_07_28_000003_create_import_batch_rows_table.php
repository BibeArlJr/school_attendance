<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('import_batch_rows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('import_batch_id')->constrained('import_batches')->cascadeOnDelete();
            $table->unsignedInteger('row_number');
            $table->string('sheet_name');
            // The row exactly as read from the sheet — kept verbatim so a
            // reviewer can always see what the source file actually said,
            // independent of how it was interpreted.
            $table->json('raw_data');
            // The system's best-effort parsed/mapped version (name split,
            // resolved class_id if confident, dob_bs extracted, etc.) —
            // what would be committed if accepted as-is.
            $table->json('proposed_data');
            // e.g. ["unrecognized_class", "possible_duplicate"].
            $table->json('flags')->default('[]');
            // No row is pre-accepted, flagged or not — every row starts
            // pending and needs an explicit reviewer decision (individual
            // or via the frontend's "accept all clean rows" bulk action)
            // before commit will touch it. See Prompt 9 SCOPE: silent
            // auto-correction isn't acceptable for student records.
            $table->string('resolution')->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('import_batch_rows');
    }
};
