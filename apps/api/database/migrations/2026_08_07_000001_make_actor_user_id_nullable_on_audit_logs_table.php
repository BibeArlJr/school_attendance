<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        // Reset-super-admin-password (recovery-endpoint prompt) is the
        // first audited action with no authenticated actor at all — it's
        // triggered via VerifyScheduledTaskSecret (a shared secret), not
        // auth:sanctum, so Auth::id() genuinely has nothing to resolve.
        // Was NOT NULL because every audited action until now had a real
        // logged-in user behind it.
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->unsignedBigInteger('actor_user_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->unsignedBigInteger('actor_user_id')->nullable(false)->change();
        });
    }
};
