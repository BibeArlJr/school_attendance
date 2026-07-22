<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        // Append-only: no update/delete route exists for this table, ever
        // (see App\Modules\Attendance\routes.php) — reviewing an anomaly
        // only ever sets reviewed_by/reviewed_at/review_note, it doesn't
        // change what was actually scanned.
        Schema::create('attendance_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('barcode_value');
            // Polymorphic-ready, nullable: unresolved scans (unknown
            // barcode) never get an owner at all.
            $table->string('resolved_owner_type')->nullable();
            $table->unsignedBigInteger('resolved_owner_id')->nullable();
            $table->foreignId('gate_device_id')->nullable()->constrained('gate_devices')->nullOnDelete();
            $table->foreignId('guard_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('scanned_at');
            $table->string('result');
            $table->boolean('needs_review')->default(false);
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_note')->nullable();
            $table->timestamps();

            $table->index(['resolved_owner_type', 'resolved_owner_id']);
            // The duplicate-scan check queries "most recent event for this
            // barcode today" on every single scan — worth its own index.
            $table->index(['barcode_value', 'scanned_at']);
        });

        // Partial index: only rows actually needing review are indexed,
        // since the anomaly queue query always filters on needs_review = true.
        DB::statement(
            'CREATE INDEX attendance_events_needs_review_partial '
            . 'ON attendance_events (school_id, needs_review) WHERE needs_review = true',
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_events');
    }
};
