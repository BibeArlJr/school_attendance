<?php

namespace App\Support\Enums;

enum ImportBatchStatus: string
{
    case Processing = 'processing';
    case ReadyForReview = 'ready_for_review';
    case Committed = 'committed';
}
