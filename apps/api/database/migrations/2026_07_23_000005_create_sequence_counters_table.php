<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        // Generic — not student-specific. Backs
        // App\Support\Services\SequenceGeneratorService, reused by any
        // module that needs a gapless, per-school, per-entity-type
        // sequential number (student admission numbers now, barcode
        // numbers in Phase 7, etc).
        Schema::create('sequence_counters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('entity_type');
            $table->string('prefix')->nullable();
            $table->unsignedBigInteger('current_value')->default(0);
            $table->timestamps();

            $table->unique(['school_id', 'entity_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sequence_counters');
    }
};
