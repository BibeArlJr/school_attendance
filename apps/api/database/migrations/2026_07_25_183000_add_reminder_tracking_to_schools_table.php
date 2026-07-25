<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            // One column per threshold rather than a dedicated table
            // (Prompt 33 Part A) — reminders are a 1:1, low-cardinality
            // fact about a school, not a growing log; a table would just
            // mean an extra join everywhere this is read. Reset to null
            // together whenever the license is renewed/reactivated, so
            // the next period's thresholds fire again.
            $table->timestamp('reminder_30_sent_at')->nullable()->after('amc_expiry_date');
            $table->timestamp('reminder_15_sent_at')->nullable()->after('reminder_30_sent_at');
            $table->timestamp('reminder_7_sent_at')->nullable()->after('reminder_15_sent_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn(['reminder_30_sent_at', 'reminder_15_sent_at', 'reminder_7_sent_at']);
        });
    }
};
