<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Narrow projection of a User acting as a class teacher. Deliberately
 * separate from UserResource: callers here only ever eager-load
 * id/name/email (see ClassController), and UserResource's fields
 * (role, school) would resolve to misleading nulls against that
 * partial load.
 */
class TeacherResource extends JsonResource
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
        ];
    }
}
