<?php

namespace App\Modules\BulkSms\Services;

use App\Modules\BulkSms\Models\BulkSmsProviderConfig;
use App\Support\Services\AuditLogger;

/**
 * The only reader/writer of bulk_sms_provider_configs — never
 * App\Modules\Sms\Models\SmsProviderConfig. There is exactly one global
 * row for the whole module (no school scoping, no per-provider key);
 * get()/update() treat "the first row, or none yet" as the entire model.
 */
class BulkSmsCredentialService
{
    public function __construct(private readonly AuditLogger $auditLogger)
    {
    }

    public function getConfig(): ?BulkSmsProviderConfig
    {
        return BulkSmsProviderConfig::query()->oldest('id')->first();
    }

    public function isConfigured(): bool
    {
        $config = $this->getConfig();

        return (bool) ($config && $config->is_active && $config->token && $config->sender_id);
    }

    /**
     * @return array{token: string, sender_id: string}|null null when not
     *  configured/active — callers treat that as "cannot send", never a
     *  crash, same contract RealSparrowSmsService::resolveCredentials()
     *  already establishes for the attendance system.
     */
    public function getRawCredentials(): ?array
    {
        $config = $this->getConfig();

        if (! $config || ! $config->is_active || ! $config->token || ! $config->sender_id) {
            return null;
        }

        return ['token' => $config->token, 'sender_id' => $config->sender_id];
    }

    public function update(string $token, string $senderId, ?int $userId): BulkSmsProviderConfig
    {
        $config = $this->getConfig();
        $wasConfigured = $this->isConfigured();

        if ($config) {
            $config->update(['token' => $token, 'sender_id' => $senderId, 'is_active' => true]);
        } else {
            $config = BulkSmsProviderConfig::create(['token' => $token, 'sender_id' => $senderId, 'is_active' => true]);
        }

        // Never logs the token itself — before/after only record that a
        // rotation happened and the (non-secret) sender_id.
        $this->auditLogger->log('bulk_sms_credential.updated', 'bulk_sms_provider_config', $config->id, [
            'was_configured' => $wasConfigured,
        ], [
            'sender_id' => $senderId,
        ]);

        return $config;
    }
}
