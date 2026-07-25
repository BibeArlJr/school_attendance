<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role->value,
            'school_id' => $this->school_id,
            'school' => $this->whenLoaded('school', fn () => $this->school ? [
                'id' => $this->school->id,
                'name' => $this->school->name,
                'slug' => $this->school->slug,
                'logo_url' => $this->school->logo_url,
                'primary_color' => $this->school->primary_color,
            ] : null),
            // Only meaningful for role=super_admin (Prompt 24) — which
            // school's data they're currently viewing, distinct from
            // `school` above (their own school_id, always null for
            // super_admin since it's a platform-level role).
            'active_school' => $this->whenLoaded('activeSchool', fn () => $this->activeSchool ? [
                'id' => $this->activeSchool->id,
                'name' => $this->activeSchool->name,
                'slug' => $this->activeSchool->slug,
                'logo_url' => $this->activeSchool->logo_url,
                'primary_color' => $this->activeSchool->primary_color,
            ] : null),
        ];
    }
}
