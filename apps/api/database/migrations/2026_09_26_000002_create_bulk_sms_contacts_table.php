<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Generic bulk-SMS contact — genuinely independent of every other
 * contact concept in this app (students, guardians, staff, chairman):
 * this module never queries or joins against any of those tables, and
 * none of them reference this one. No school_id at all — this is a
 * platform-level tool (super_admin/platform-admin only, see
 * app/Modules/BulkSms/routes.php), not a per-school feature, so there is
 * no tenant to scope it to.
 *
 * `phone` stores ONLY the normalized, canonical form (see
 * BulkSmsPhoneNormalizer) — the as-typed/as-uploaded original is never
 * persisted here; it exists only transiently in the upload preview
 * response, before a row is ever written (Prompt: revised upload flow).
 * The unique index is the real, DB-level dedupe guarantee — the
 * application-level duplicate check during upload preview/confirm is a
 * friendlier layer on top of this, not the only thing preventing two
 * differently-formatted entries of the same number.
 */
return new class () extends Migration {
    public function up(): void
    {
        Schema::create('bulk_sms_contacts', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('name')->nullable();
            $table->string('phone', 10)->unique();
            // Nullable — a manually-added contact has no upload batch.
            $table->foreignId('upload_id')->nullable()->constrained('bulk_sms_uploads')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bulk_sms_contacts');
    }
};
