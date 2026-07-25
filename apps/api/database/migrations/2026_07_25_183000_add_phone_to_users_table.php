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
        Schema::table('users', function (Blueprint $table) {
            // Nothing captured a login user's own phone before this
            // (only parent_guardians.phone existed, for a different
            // purpose) — needed so license-reminder SMS (Prompt 33 Part
            // B) has somewhere to send admin texts. Nullable: no
            // historical data to backfill, existing admins simply have
            // none until set.
            $table->string('phone')->nullable()->after('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('phone');
        });
    }
};
