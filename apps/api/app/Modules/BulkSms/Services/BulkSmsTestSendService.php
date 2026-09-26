<?php

namespace App\Modules\BulkSms\Services;

use App\Modules\BulkSms\Exceptions\BulkSmsTestSendThrottledException;
use App\Modules\BulkSms\Models\BulkSmsSendLog;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

/**
 * Stage 2's core safety boundary: this class accepts exactly one raw
 * phone string and one message string, and nothing else. It never
 * imports, queries, or references App\Modules\BulkSms\Models\
 * BulkSmsContact or BulkSmsUpload — there is no code path here that can
 * reach any of the ~785 stored contacts. There is no loop over any
 * recipient collection; at most one BulkSparrowSmsService::send() call
 * happens per invocation.
 */
class BulkSmsTestSendService
{
    /** Double-click / rapid-resubmit window — a second request for the
     *  SAME normalized number inside this many seconds is rejected as a
     *  no-op rather than firing a second real Sparrow call. */
    private const DUPLICATE_WINDOW_SECONDS = 5;

    public function __construct(
        private readonly BulkSmsPhoneNormalizer $normalizer,
        private readonly BulkSparrowSmsService $sparrowService,
    ) {
    }

    public function send(string $rawPhone, string $message, ?int $userId): BulkSmsSendLog
    {
        $result = $this->normalizer->normalize($rawPhone);

        if (! $result['valid']) {
            throw ValidationException::withMessages(['phone' => [$result['reason']]]);
        }

        $normalized = $result['normalized'];

        $lockKey = "bulk_sms_test_send:{$normalized}";
        if (! Cache::add($lockKey, true, self::DUPLICATE_WINDOW_SECONDS)) {
            throw new BulkSmsTestSendThrottledException(
                'A test SMS to this number was just sent. Please wait a few seconds before sending another.',
            );
        }

        $attemptedAt = now();
        $sendResult = $this->sparrowService->send($normalized, $message);

        $log = BulkSmsSendLog::create([
            'recipient' => $normalized,
            'message' => $message,
            'segment_count' => $this->countSegments($message),
            'status' => $sendResult['status'],
            'provider_response_code' => $sendResult['response_code'],
            'provider_response_message' => $sendResult['response_message'],
            'attempted_at' => $attemptedAt,
            'sent_at' => $sendResult['status'] !== 'failed' ? $attemptedAt : null,
            'created_by' => $userId,
        ]);

        return $log;
    }

    /**
     * Independent, server-side segment count for the stored log — not
     * the same code as shared/lib/smsSegments.ts (that stays the
     * frontend's live, authoritative display, reused exactly as-is by
     * the Compose Message and Test SMS tabs). This is a compact PHP
     * port of the same GSM 03.38 rules, kept here only because the log
     * needs a trustworthy number and the frontend's own count is never
     * assumed rather than verified. mb_strlen (Unicode code points), not
     * UTF-16 code units — a reasonable, clearly-scoped approximation for
     * this record-keeping column, not a billing-critical value.
     */
    private function countSegments(string $message): int
    {
        if ($message === '') {
            return 0;
        }

        // \$ (escaped) — an unescaped '$' immediately followed by a
        // multi-byte character here is parsed by PHP as the start of a
        // variable-interpolation token, not a literal dollar sign,
        // which threw "Undefined variable" until this was escaped
        // (caught by this file's own test suite, not just review).
        $gsm7Basic = "@£\$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
        $gsm7Extended = ['^', '{', '}', '\\', '[', '~', ']', '|', '€', "\f"];

        $isGsm7 = true;
        $septets = 0;

        foreach (mb_str_split($message, 1, 'UTF-8') as $char) {
            if (in_array($char, $gsm7Extended, true)) {
                $septets += 2;

                continue;
            }
            if (mb_strpos($gsm7Basic, $char) === false) {
                $isGsm7 = false;

                break;
            }
            $septets++;
        }

        if (! $isGsm7) {
            $length = mb_strlen($message, 'UTF-8');

            return $length <= 70 ? 1 : (int) ceil($length / 67);
        }

        return $septets <= 160 ? 1 : (int) ceil($septets / 153);
    }
}
