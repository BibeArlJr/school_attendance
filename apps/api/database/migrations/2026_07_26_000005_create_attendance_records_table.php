<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            // Polymorphic-ready — only 'student' is ever populated this
            // phase (teacher attendance deferred), so no student_id FK.
            $table->string('owner_type');
            $table->unsignedBigInteger('owner_id');
            $table->date('date');
            $table->time('in_time')->nullable();
            $table->time('out_time')->nullable();
            $table->string('status')->default('absent');
            $table->string('day_type')->default('working');
            $table->boolean('late')->default(false);
            $table->boolean('early_departure')->default(false);
            $table->string('source')->default('scan');
            $table->foreignId('modified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('override_reason')->nullable();
            $table->timestamps();

            $table->unique(['school_id', 'owner_type', 'owner_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};
