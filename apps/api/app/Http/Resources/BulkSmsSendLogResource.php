<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BulkSmsSendLogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'recipient' => $this->recipient,
            'message' => $this->message,
            'segment_count' => $this->segment_count,
            'status' => $this->status,
            'provider_response_code' => $this->provider_response_code,
            'provider_response_message' => $this->provider_response_message,
            'attempted_at' => $this->attempted_at?->toIso8601String(),
            'sent_at' => $this->sent_at?->toIso8601String(),
        ];
    }
}
