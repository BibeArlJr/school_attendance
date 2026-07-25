<?php

namespace App\Modules\Sms\Models;

use App\Modules\Attendance\Models\AttendanceRecord;
use App\Modules\School\Models\School;
use App\Support\Concerns\BelongsToSchool;
use App\Support\Enums\SmsLogStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsLog extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id',
        'recipient_phone',
        'message',
        'status',
        'provider_response_code',
        'provider_response_message',
        'related_attendance_record_id',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => SmsLogStatus::class,
            'sent_at' => 'datetime',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function relatedAttendanceRecord(): BelongsTo
    {
        return $this->belongsTo(AttendanceRecord::class, 'related_attendance_record_id');
    }
}
