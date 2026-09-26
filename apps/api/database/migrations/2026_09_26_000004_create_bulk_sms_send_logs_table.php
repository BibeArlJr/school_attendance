<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stage 2's delivery record for a single test-send attempt — same
 * information shape as the attendance system's sms_logs (recipient,
 * message, status, provider response code/message, timestamps), but a
 * wholly separate table: no school_id, no FK to sms_logs or
 * attendance_records, and the Sparrow token is never stored here.
 *
 * 'recipient' is always the normalized 10-digit form (never the raw
 * as-typed input) — same convention bulk_sms_contacts already uses.
 */
return new class () extends Migration {
    public function up(): void
    {
        Schema::create('bulk_sms_send_logs', function (Blueprint $table) {
            $table->id();
            $table->string('recipient', 10);
            $table->text('message');
            $table->unsignedSmallInteger('segment_count')->default(0);
            // 'sent' | 'failed' | 'mock' — see BulkSmsTestSendService.
            $table->string('status');
            $table->integer('provider_response_code')->nullable();
            $table->string('provider_response_message')->nullable();
            $table->timestamp('attempted_at');
            $table->timestamp('sent_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('recipient');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bulk_sms_send_logs');
    }
};
