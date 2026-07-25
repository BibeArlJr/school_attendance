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
            // Orthogonal to license_status/amc_expiry_date (Prompt 35
            // Part E) — a platform-level "is this school even allowed on
            // this platform at all" switch, distinct from "has this
            // school paid." Default true: every existing school stays
            // reachable, this is purely additive.
            $table->boolean('is_active')->default(true)->after('license_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }
};
