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
        return [
            'id' => $this->id,
            'barcode_value' => $this->barcode_value,
            'status' => $this->status->value,
            'issued_date' => $this->issued_date->toDateString(),
            'deactivated_date' => $this->deactivated_date?->toDateString(),
            'owner_type' => $this->owner_type,
            'student' => $this->owner_type === 'student' ? $this->studentSummary() : null,
            'staff' => $this->owner_type === 'staff' ? $this->staffSummary() : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function studentSummary(): array
    {
        $student = $this->owner;

        return [
            'id' => $student->id,
            'first_name' => $student->first_name,
            'last_name' => $student->last_name,
            'school_class' => $student->schoolClass ? [
                'id' => $student->schoolClass->id,
                'name' => $student->schoolClass->name,
                'section' => $student->schoolClass->section,
            ] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function staffSummary(): array
    {
        $staff = $this->owner;

        return [
            'id' => $staff->id,
            'name' => $staff->user->name,
            'designation' => $staff->designation,
        ];
    }
}
