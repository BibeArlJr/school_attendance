<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('id_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            // Polymorphic-ready: only 'student' exists as owner_type today
            // (see Relation::morphMap in AppServiceProvider), 'staff' is
            // valid future data, not built yet.
            $table->string('owner_type');
            $table->unsignedBigInteger('owner_id');
            // Never reused, even across reissues for the same student —
            // each reissue allocates a fresh SequenceGeneratorService
            // value under entity_type STUDENT_CARD, so uniqueness here is
            // a safety net, not the actual non-reuse guarantee.
            $table->string('barcode_value')->unique();
            $table->string('status')->default('active');
            $table->date('issued_date');
            $table->date('deactivated_date')->nullable();
            $table->timestamps();

            $table->index(['owner_type', 'owner_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('id_cards');
    }
};
