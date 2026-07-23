<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ImportBatchResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'file_name' => $this->file_name,
            'uploaded_at' => $this->uploaded_at->toIso8601String(),
            'total_rows' => $this->total_rows,
            'imported_count' => $this->imported_count,
            'skipped_count' => $this->skipped_count,
            'skipped_sheets' => $this->skipped_sheets ?? [],
            'status' => $this->status->value,
            'rows' => ImportBatchRowResource::collection($this->whenLoaded('rows')),
        ];
    }
}
