<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * New HR-domain personnel table — genuinely independent of `users`
 * (deliberately no user_id column/FK): a staff record is real-world
 * employee data (a teacher, etc.), not a system login. `user_accounts`
 * (renamed from the old `staff` table this prompt's rename freed up)
 * is the unrelated concept that DOES carry login capability.
 *
 * Not unique on citizenship_number at the DB level — real imported data
 * can have it blank/missing on some rows, and duplicate detection
 * during import falls back to name+mobile in that case (see the staff
 * import prompt), so a hard uniqueness constraint would reject
 * legitimate blank-citizenship-number rows outright.
 */
return new class () extends Migration {
    public function up(): void
    {
        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('name');
            $table->string('mobile')->nullable();
            $table->string('dob_bs')->nullable();
            $table->string('address')->nullable();
            $table->string('citizenship_number')->nullable();
            $table->index('citizenship_number');
            $table->string('designation')->nullable();
            $table->string('rank')->nullable();
            $table->string('sheet_roll_no')->nullable();
            $table->string('level')->nullable();
            $table->string('employment_status')->default('active');
            $table->foreignId('import_batch_id')->nullable()->constrained('import_batches')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff');
    }
};
