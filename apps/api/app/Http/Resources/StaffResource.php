<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StaffResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'name' => $this->name,
            'mobile' => $this->mobile,
            'dob_bs' => $this->dob_bs,
            'address' => $this->address,
            'citizenship_number' => $this->citizenship_number,
            'designation' => $this->designation,
            'rank' => $this->rank,
            'sheet_roll_no' => $this->sheet_roll_no,
            'level' => $this->level,
            'employment_status' => $this->employment_status->value,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
