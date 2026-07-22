<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceEventResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $student = $this->resolvedOwner;

        return [
            'id' => $this->id,
            'barcode_value' => $this->barcode_value,
            'result' => $this->result->value,
            'scanned_at' => $this->scanned_at->toIso8601String(),
            'needs_review' => $this->needs_review,
            'reviewed_by' => $this->reviewed_by,
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'review_note' => $this->review_note,
            'gate_device' => $this->whenLoaded('gateDevice', fn () => $this->gateDevice ? [
                'id' => $this->gateDevice->id,
                'name' => $this->gateDevice->name,
            ] : null),
            'guard' => $this->whenLoaded('guardUser', fn () => $this->guardUser ? [
                'id' => $this->guardUser->id,
                'name' => $this->guardUser->name,
            ] : null),
            'student' => $student ? [
                'id' => $student->id,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'admission_no' => $student->admission_no,
                'school_class' => $student->schoolClass ? [
                    'id' => $student->schoolClass->id,
                    'name' => $student->schoolClass->name,
                    'section' => $student->schoolClass->section,
                ] : null,
            ] : null,
        ];
    }
}
