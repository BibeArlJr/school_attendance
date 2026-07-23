<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropUnique(['school_id', 'admission_no']);
            $table->dropColumn('admission_no');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Best-effort reversal only — the actual admission numbers are
            // gone, this just restores the column shape.
            $table->string('admission_no')->nullable()->after('class_id');
        });
    }
};
