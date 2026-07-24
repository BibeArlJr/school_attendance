<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            // Onboarding contact info for a newly created school (Prompt
            // 24's Platform Console) — didn't exist before since only one
            // school existed and it was seeded directly, never onboarded
            // through a form.
            $table->string('contact_email')->nullable()->after('primary_color');
            $table->string('contact_phone')->nullable()->after('contact_email');
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn(['contact_email', 'contact_phone']);
        });
    }
};
