<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            // Current class — denormalized convenience pointer. The
            // historical record of class assignments lives in
            // student_enrollments. Required: a student is always assigned
            // a class on creation (no "unassigned" state in this phase).
            $table->foreignId('class_id')->constrained('classes')->restrictOnDelete();
            $table->string('admission_no');
            $table->string('first_name');
            $table->string('last_name');
            $table->date('dob');
            $table->string('gender');
            $table->string('status')->default('active');
            $table->date('admission_date');
            $table->timestamps();

            $table->unique(['school_id', 'admission_no']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
