<?php

namespace App\Support\Exceptions;

use RuntimeException;

/**
 * Thrown by ImportCommitService::commit() when a batch has already been
 * claimed/committed (double-submit bug fix). Controllers catch this and
 * return ApiResponse::error($e->getMessage(), null, 409) — same pattern
 * as DeleteBlockedException, caught per-controller rather than globally.
 */
class ImportBatchAlreadyCommittedException extends RuntimeException
{
}
