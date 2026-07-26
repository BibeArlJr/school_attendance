<?php

use App\Modules\Sms\Models\SmsProviderConfig;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('sms_provider_configs', function (Blueprint $table) {
            $table->id();
            // Nullable = platform-wide default, used when no school-
            // specific row exists (Prompt 43). Deliberately not scoped by
            // the BelongsToSchool trait — the resolution query needs to
            // see both a specific school's row AND the null-school_id
            // fallback row in the same lookup, which that trait's
            // automatic single-school filter would prevent.
            $table->foreignId('school_id')->nullable()->constrained('schools')->cascadeOnDelete();
            $table->string('provider_name');
            // Encrypted (App\Modules\Sms\Models\SmsProviderConfig's
            // 'encrypted:array' cast) — token/sender_id are never stored
            // as plaintext. text, not string: Laravel's encrypted payload
            // is meaningfully longer than the source value.
            $table->text('credentials');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // A school may have at most one row per provider; the
            // platform default (school_id null) likewise at most one per
            // provider — a plain unique index treats NULL as distinct
            // per row in Postgres, which is exactly the "one platform
            // default row" constraint this needs.
            $table->unique(['school_id', 'provider_name']);
        });

        // One-time migration of the pre-existing .env-only credential
        // (Prompt 43) — every school currently shares this single
        // Sparrow account, so this is the one platform-wide (school_id
        // null) default row, not a per-school seed. Runs from whatever
        // is actually in .env/config at migrate time (blank in this dev
        // environment, since SMS_DRIVER=mock here — a real deployment
        // with real Sparrow values already in .env would carry those
        // real values into this row instead). .env's SPARROW_SMS_TOKEN/
        // SPARROW_SMS_SENDER_ID are removed as an ongoing config path
        // right after this migration ships; this is the one place they
        // still get read from env at all.
        SmsProviderConfig::query()->firstOrCreate(
            ['school_id' => null, 'provider_name' => 'sparrow'],
            [
                'credentials' => [
                    'token' => env('SPARROW_SMS_TOKEN', ''),
                    'sender_id' => env('SPARROW_SMS_SENDER_ID', ''),
                ],
                'is_active' => true,
            ],
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_provider_configs');
    }
};
