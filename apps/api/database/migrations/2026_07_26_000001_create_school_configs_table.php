<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        // One row per school (school_id is the primary key, not a
        // separate auto-increment id) — a school has exactly one config.
        Schema::create('school_configs', function (Blueprint $table) {
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedInteger('late_threshold_minutes');
            $table->unsignedInteger('early_departure_threshold_minutes');
            $table->unsignedInteger('duplicate_scan_window_seconds');
            // 0=Sun..6=Sat, e.g. [0,1,2,3,4,5] for Nepal's Sun-Fri week.
            $table->json('working_days');
            $table->timestamps();

            $table->primary('school_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_configs');
    }
};
