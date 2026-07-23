<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->text('address')->nullable()->after('admission_date');
            // Bikram Sambat (Nepali calendar) source date, stored as raw
            // text — no BS->AD conversion happens in this phase. `dob`
            // (Gregorian) is left null for imported rows; a future phase
            // handles conversion.
            $table->string('dob_bs')->nullable()->after('address');
            $table->foreignId('import_batch_id')->nullable()->after('dob_bs')
                ->constrained('import_batches')->nullOnDelete();
        });

        Schema::table('students', function (Blueprint $table) {
            $table->date('dob')->nullable()->change();
            $table->string('gender')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropConstrainedForeignId('import_batch_id');
            $table->dropColumn(['address', 'dob_bs']);
        });

        Schema::table('students', function (Blueprint $table) {
            $table->date('dob')->nullable(false)->change();
            $table->string('gender')->nullable(false)->change();
        });
    }
};
