<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParentGuardianResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'school_id' => $this->school_id,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'user_id' => $this->user_id,
            // No parent portal exists yet, so nothing currently eager-loads
            // this — wrapped anyway per the standing UserResource rule, so
            // the day something does, it can't accidentally return a raw
            // User.
            'user' => $this->whenLoaded('user', fn () => new UserResource($this->user)),
            'linked_students_count' => $this->whenCounted('links'),
            'linked_students' => $this->whenLoaded(
                'links',
                fn () => $this->links->map(fn ($link) => [
                    'link_id' => $link->id,
                    'relation' => $link->relation->value,
                    'is_primary_contact' => $link->is_primary_contact,
                    'student' => [
                        'id' => $link->student->id,
                        'first_name' => $link->student->first_name,
                        'last_name' => $link->student->last_name,
                        'school_class' => $link->student->schoolClass ? [
                            'id' => $link->student->schoolClass->id,
                            'name' => $link->student->schoolClass->name,
                            'section' => $link->student->schoolClass->section,
                        ] : null,
                    ],
                ]),
            ),
        ];
    }
}
