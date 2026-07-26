<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            // Nullable — some audited actions (e.g. platform-level school
            // creation) aren't scoped to a pre-existing school. Not FK-
            // constrained to cascade-delete: an audit trail must survive
            // the entity it describes being deleted later, which is
            // exactly the kind of action this table exists to record.
            $table->unsignedBigInteger('school_id')->nullable();
            $table->unsignedBigInteger('actor_user_id');
            // e.g. "student.deleted", "license.activated" — a plain
            // string, not an enum: this list grows independently of any
            // one module's release cycle, and a DB-level enum would need
            // a migration for every addition.
            $table->string('action');
            $table->string('entity_type');
            // Nullable — some audited actions (settings changes) describe
            // a change to school-level config, not one specific row.
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('before_json')->nullable();
            $table->json('after_json')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('school_id');
            $table->index('actor_user_id');
            $table->index('action');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
