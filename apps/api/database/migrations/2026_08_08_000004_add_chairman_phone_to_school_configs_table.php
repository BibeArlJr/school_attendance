<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Single school-wide chairman phone — staff attendance notifications
 * have no per-staff "guardian" equivalent, so this is the one number
 * every staff matched_in/matched_out SMS goes to (Part E of the
 * rebuild-staff prompt).
 */
return new class () extends Migration {
    public function up(): void
    {
        Schema::table('school_configs', function (Blueprint $table) {
            $table->string('chairman_phone')->nullable()->after('school_id');
        });
    }

    public function down(): void
    {
        Schema::table('school_configs', function (Blueprint $table) {
            $table->dropColumn('chairman_phone');
        });
    }
};
