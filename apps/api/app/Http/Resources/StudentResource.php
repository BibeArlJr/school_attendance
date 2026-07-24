<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * barcode_value (via the eager-loaded idCard relation) is this student's
 * sole human-facing identifier — admission_no never existed beyond an
 * early draft column, since removed (Prompt 16). Nested relations are
 * passed through as loaded rather than re-wrapped in their own
 * resources, matching the shape the frontend already expects from the
 * raw-model responses this replaces.
 */
class StudentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'school_id' => $this->school_id,
            'class_id' => $this->class_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'dob' => $this->dob,
            'gender' => $this->gender,
            'status' => $this->status,
            'admission_date' => $this->admission_date,
            'address' => $this->address,
            'dob_bs' => $this->dob_bs,
            'import_batch_id' => $this->import_batch_id,
            'barcode_value' => $this->whenLoaded('idCard', fn () => $this->idCard?->barcode_value),
            'school_class' => $this->whenLoaded('schoolClass'),
            'current_enrollment' => $this->whenLoaded('currentEnrollment'),
            'primary_parent_link' => $this->whenLoaded(
                'primaryParentLink',
                fn () => $this->primaryParentLink ? [
                    'id' => $this->primaryParentLink->id,
                    'student_id' => $this->primaryParentLink->student_id,
                    'parent_id' => $this->primaryParentLink->parent_id,
                    'relation' => $this->primaryParentLink->relation->value,
                    'is_primary_contact' => $this->primaryParentLink->is_primary_contact,
                    'parent_guardian' => $this->primaryParentLink->relationLoaded('parentGuardian')
                        ? $this->primaryParentLink->parentGuardian
                        : null,
                ] : null,
            ),
        ];
    }
}
