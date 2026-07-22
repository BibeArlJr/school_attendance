<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            // Unique: exactly one staff profile per user account.
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('designation');
            $table->string('qualification')->nullable();
            $table->date('joined_date');
            $table->string('employment_status')->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff');
    }
};
