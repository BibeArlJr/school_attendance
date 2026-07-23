<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ImportBatchRowResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'row_number' => $this->row_number,
            'sheet_name' => $this->sheet_name,
            'raw_data' => $this->raw_data,
            'proposed_data' => $this->proposed_data,
            'flags' => $this->flags,
            'resolution' => $this->resolution->value,
        ];
    }
}
