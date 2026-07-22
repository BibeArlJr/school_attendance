<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A student's-eye view of a StudentParentLink: the link plus the linked
 * parent's contact info. Mirror of ParentGuardianResource's
 * 'linked_students' shape, but from the other direction.
 */
class StudentGuardianResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'link_id' => $this->id,
            'relation' => $this->relation->value,
            'is_primary_contact' => $this->is_primary_contact,
            'parent' => [
                'id' => $this->parentGuardian->id,
                'name' => $this->parentGuardian->name,
                'phone' => $this->parentGuardian->phone,
                'email' => $this->parentGuardian->email,
            ],
        ];
    }
}
