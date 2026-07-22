<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            // Short, unique code used in barcode values (e.g. SCH001) —
            // distinct from `slug`, which is for URLs. Nullable: only one
            // school exists so far (ADR 0001), no onboarding flow exists
            // yet to require it for a school created some other way.
            $table->string('school_code')->nullable()->unique()->after('slug');
        });

        // Backfills the school this codebase has had since Phase 1. A
        // genuinely fresh install (migrate:fresh --seed) has no `schools`
        // rows yet at this point — DemoSeeder sets school_code directly
        // on creation for that case instead.
        DB::table('schools')->where('slug', 'demo-school')->update(['school_code' => 'SCH001']);
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn('school_code');
        });
    }
};
