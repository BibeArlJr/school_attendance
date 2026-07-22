<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        // Unlike parent_guardians (real people, no-hard-delete), rows here
        // are a plain association between a student and a parent — a real
        // DELETE is correct when unlinking, so no soft-delete column.
        Schema::create('student_parent_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('parent_id')->constrained('parent_guardians')->cascadeOnDelete();
            $table->string('relation');
            $table->boolean('is_primary_contact')->default(false);
            $table->timestamps();

            $table->unique(['student_id', 'parent_id']);
        });

        // Business rule: at most one primary contact per student. Enforced
        // at the database level as a safety net (not just in application
        // code, which unsets any existing primary before inserting a new
        // one in the same transaction) — a partial unique index, since a
        // plain unique constraint on is_primary_contact alone would also
        // block multiple *non*-primary rows, which is fine.
        DB::statement(
            'CREATE UNIQUE INDEX student_parent_links_primary_contact_unique '
            . 'ON student_parent_links (student_id) WHERE is_primary_contact = true',
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('student_parent_links');
    }
};
