<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Only meaningful for role=super_admin — a regular user's
            // school_id already fixes their school, unchanged by this
            // phase. Persisted server-side here (a column on the user's
            // own row) rather than in a PHP session: this API is
            // Bearer-token/stateless (ADR 0002, no cookie-based Sanctum
            // stateful auth, no StartSession middleware on the api routes)
            // so a plain session() call wouldn't reliably persist across
            // requests anyway. nullOnDelete: deleting a school a
            // super_admin currently has selected just clears the
            // selection, doesn't block the delete or orphan anything.
            $table->foreignId('active_school_id')->nullable()->after('school_id')
                ->constrained('schools')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('active_school_id');
        });
    }
};
