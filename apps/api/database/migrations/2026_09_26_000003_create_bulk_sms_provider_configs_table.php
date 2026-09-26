<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stage 2 of the Bulk SMS module — the separate Sparrow credential for
 * this module. Deliberately its own table, no FK, no shared row, no
 * migration of data from sms_provider_configs (the attendance/school
 * system's own credential table) — this module must never read, copy,
 * or fall back to that table or RealSparrowSmsService in any way.
 *
 * Only `token` is encrypted — `sender_id` is a public-facing SMS sender
 * name (shown to every recipient), not a secret, so it stays a plain
 * column rather than folded into an encrypted blob (unlike
 * sms_provider_configs, which encrypts both together as one JSON blob;
 * this module's masking needs — show sender_id in full, mask only the
 * token — are cleaner with them split).
 *
 * A single global row is the whole model here — no school_id, no
 * per-provider uniqueness key like sms_provider_configs has, since
 * there is only ever one bulk credential for the whole platform.
 */
return new class () extends Migration {
    public function up(): void
    {
        Schema::create('bulk_sms_provider_configs', function (Blueprint $table) {
            $table->id();
            // Laravel's 'encrypted' cast (App\Modules\BulkSms\Models\
            // BulkSmsProviderConfig) encrypts before write, decrypts on
            // read — the DB only ever sees ciphertext. text, not
            // string: the encrypted payload is meaningfully longer than
            // the source token.
            $table->text('token')->nullable();
            $table->string('sender_id')->nullable();
            // "Configured" in the API/UI sense is derived (token AND
            // sender_id both present) — this flag is the separate,
            // explicit "enabled" switch an admin controls, matching the
            // is_active convention on sms_provider_configs.
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bulk_sms_provider_configs');
    }
};
