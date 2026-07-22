<?php

namespace App\Support\Models;

use Illuminate\Database\Eloquent\Model;

class SequenceCounter extends Model
{
    protected $fillable = ['school_id', 'entity_type', 'prefix', 'current_value'];
}
