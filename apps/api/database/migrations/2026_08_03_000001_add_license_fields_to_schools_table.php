<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            // license_status is a record of the last explicit activation
            // action, not the source of truth for enforcement/display —
            // that's always computed live from amc_expiry_date (Prompt 25
            // Part C), so it can never silently drift out of sync just by
            // time passing. Defaults to 'active' with a null expiry date:
            // an existing/never-activated school is never retroactively
            // locked out (see School::licenseStatus()).
            $table->string('license_status')->default('active')->after('contact_phone');
            $table->date('amc_expiry_date')->nullable()->after('license_status');
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn(['license_status', 'amc_expiry_date']);
        });
    }
};
