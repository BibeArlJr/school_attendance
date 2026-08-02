<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Mock-service pattern (docs/architecture/service-pattern.md).
    // Credentials for the 'real' driver are no longer an env/config path
    // (Prompt 43) — see sms_provider_configs (encrypted DB storage) and
    // RealSparrowSmsService, which resolves them itself per call.
    'sms' => [
        'driver' => env('SMS_DRIVER', 'mock'),
    ],

    // Shared secret for POST /api/tasks/* (Prompt 55 Part E) — Render's
    // Cron Jobs aren't free-tier eligible, so scheduled commands run via
    // an external cron-ping service (or a GitHub Actions scheduled
    // workflow) hitting these endpoints instead. Deliberately null by
    // default: VerifyScheduledTaskSecret rejects every request, secret
    // configured or not, unless this is explicitly set — never silently
    // open by omission.
    'scheduled_tasks' => [
        'secret' => env('SCHEDULED_TASK_SECRET'),
    ],

];
