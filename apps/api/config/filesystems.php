<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

        // Backblaze B2 (S3-compatible API) — persistent object storage for
        // uploads, replacing Render's ephemeral container filesystem (the
        // 'public' disk, wiped on every redeploy). Distinct B2_* env vars,
        // not the generic AWS_* ones the unused 's3' disk above already
        // reads — these are genuinely different credentials/service, and
        // reusing the AWS_* names would make it ambiguous which provider a
        // given env var actually configures if AWS S3 is ever added later.
        'b2' => [
            'driver' => 's3',
            'key' => env('B2_KEY_ID'),
            'secret' => env('B2_APPLICATION_KEY'),
            'region' => env('B2_REGION'),
            'bucket' => env('B2_BUCKET'),
            'endpoint' => env('B2_ENDPOINT'),
            // Verified empirically against the real bucket (see this
            // change's own commit message / docs/operations note) —
            // Backblaze's S3-compatible API expects virtual-hosted-style
            // requests (https://{bucket}.{endpoint-host}/...), not
            // path-style (https://{endpoint-host}/{bucket}/...).
            'use_path_style_endpoint' => false,
            'throw' => false,
            'report' => false,
        ],

    ],

    // The disk real file uploads (currently: school logos) are written
    // to — a single named indirection so upload code never hardcodes a
    // disk string, and there's one place to point every upload feature
    // at the same persistent disk if a second one is ever added. Not
    // driven by the framework's own FILESYSTEM_DISK/'default' (that
    // stays 'local' and is otherwise unused in this app) — that setting
    // is Laravel's own generic fallback, this is this app's specific
    // "where do uploads persist" answer.
    //
    // Defaults to 'public' (local disk), NOT 'b2' — persistence only
    // matters where redeploys wipe the disk (Render), which a local dev
    // machine never does. Local dev needs zero B2 credentials to upload
    // a logo; production sets UPLOADS_DISK=b2 explicitly in Render's
    // environment to opt into persistent storage.
    'uploads_disk' => env('UPLOADS_DISK', 'public'),

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
