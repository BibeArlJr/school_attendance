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
        $owner = $this->resolvedOwner;
        $ownerType = $this->resolved_owner_type;

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
            'owner_type' => $ownerType,
            'student' => $ownerType === 'student' && $owner ? [
                'id' => $owner->id,
                'first_name' => $owner->first_name,
                'last_name' => $owner->last_name,
                'admission_no' => $owner->admission_no,
                'school_class' => $owner->schoolClass ? [
                    'id' => $owner->schoolClass->id,
                    'name' => $owner->schoolClass->name,
                    'section' => $owner->schoolClass->section,
                ] : null,
            ] : null,
            'staff' => $ownerType === 'staff' && $owner ? [
                'id' => $owner->id,
                'name' => $owner->user->name,
                'designation' => $owner->designation,
            ] : null,
        ];
    }
}
