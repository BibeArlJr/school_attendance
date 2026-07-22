<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

// Never returns the raw User model — per the standing convention (Prompt
// 4-Patch), only the specific safe fields needed here.
class StaffResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $this->user;

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'name' => $user->name,
            'email' => $user->email,
            'is_active' => $user->is_active,
            'designation' => $this->designation,
            'qualification' => $this->qualification,
            'joined_date' => $this->joined_date->toDateString(),
            'employment_status' => $this->employment_status->value,
        ];
    }
}
