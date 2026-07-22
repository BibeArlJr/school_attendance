<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Nullable: super_admin is not scoped to any single school.
            $table->foreignId('school_id')->nullable()->after('id')
                ->constrained('schools')->nullOnDelete();
            $table->string('role')->default('admin')->after('school_id');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('school_id');
            $table->dropColumn('role');
            $table->dropSoftDeletes();
        });
    }
};
