<?php

namespace App\Support\Exceptions;

use RuntimeException;

/**
 * Thrown by a destroy() service method when a record has real activity
 * attached and the safe-delete rule blocks it (Prompt 11). Controllers
 * catch this and return ApiResponse::error($e->getMessage(), null, 422) —
 * deliberately not Laravel's ValidationException, whose top-level
 * `message` is a generic "The given data was invalid." wrapper; the
 * frontend needs the exact, specific reason shown here verbatim.
 */
class DeleteBlockedException extends RuntimeException
{
}
