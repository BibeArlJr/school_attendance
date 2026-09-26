<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Never returns the full token — only a masked form (last 4 characters,
 * same "show just enough to recognize it, nothing more" convention as
 * every other secret-masking spot in this app). No existing masking
 * helper was found anywhere in this codebase to reuse, so this is a new,
 * minimal one: a fixed-length bullet prefix (not the real token length,
 * so nothing about the token's actual size leaks) plus its last 4 chars.
 */
class BulkSmsProviderConfigResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $token = $this->token;
        $senderId = $this->sender_id;

        return [
            'configured' => (bool) ($token && $senderId),
            'is_active' => (bool) $this->is_active,
            'sender_id' => $senderId,
            'masked_token' => $token ? ('••••'.substr($token, -4)) : null,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
