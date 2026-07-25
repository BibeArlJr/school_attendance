<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->string('designation')->nullable()->change();
            $table->dropColumn(['qualification', 'joined_date']);
        });
    }

    public function down(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->string('designation')->nullable(false)->change();
            $table->string('qualification')->nullable();
            $table->date('joined_date')->nullable();
        });
    }
};
