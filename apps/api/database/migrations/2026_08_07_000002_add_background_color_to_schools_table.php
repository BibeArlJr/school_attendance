<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        // Nullable, same as primary_color — null means "no override",
        // not a stored color, so the app's light/dark mode default keeps
        // applying automatically until a school deliberately sets one.
        Schema::table('schools', function (Blueprint $table) {
            $table->string('background_color', 7)->nullable()->after('primary_color');
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn('background_color');
        });
    }
};
