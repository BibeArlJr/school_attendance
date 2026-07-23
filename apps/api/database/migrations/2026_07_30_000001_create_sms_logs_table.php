<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('sms_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('recipient_phone');
            $table->text('message');
            $table->string('status')->default('failed');
            // Real Sparrow response_code (200 on success, 1000-1013 on
            // failure) — stored verbatim, not remapped to our own codes,
            // so the actual provider error is always visible on a failed
            // row. Null only when the request never got a parseable
            // response at all (network/timeout exception).
            $table->integer('provider_response_code')->nullable();
            $table->string('provider_response_message')->nullable();
            $table->foreignId('related_attendance_record_id')->nullable()
                ->constrained('attendance_records')->nullOnDelete();
            $table->timestamp('sent_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_logs');
    }
};
