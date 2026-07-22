<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IdCardResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $student = $this->owner;

        return [
            'id' => $this->id,
            'barcode_value' => $this->barcode_value,
            'status' => $this->status->value,
            'issued_date' => $this->issued_date->toDateString(),
            'deactivated_date' => $this->deactivated_date?->toDateString(),
            'student' => [
                'id' => $student->id,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'admission_no' => $student->admission_no,
                'school_class' => $student->schoolClass ? [
                    'id' => $student->schoolClass->id,
                    'name' => $student->schoolClass->name,
                    'section' => $student->schoolClass->section,
                ] : null,
            ],
        ];
    }
}
