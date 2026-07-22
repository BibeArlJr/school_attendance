<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('school_calendars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->date('date');
            $table->string('day_type')->default('working');
            $table->string('label')->nullable();
            // Only meaningful when day_type = half_day.
            $table->time('half_day_end_time')->nullable();
            $table->timestamps();

            $table->unique(['school_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_calendars');
    }
};
