<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Access / Refresh Token Lifetimes
    |--------------------------------------------------------------------------
    |
    | Access tokens are short-lived and used as the Bearer token on every
    | authenticated request. Refresh tokens are longer-lived, single-use
    | (rotated on every refresh), and only accepted on POST /auth/refresh.
    |
    */

    'access_ttl_minutes' => (int) env('ACCESS_TOKEN_TTL_MINUTES', 120),

    'refresh_ttl_minutes' => (int) env('REFRESH_TOKEN_TTL_MINUTES', 60 * 24 * 7),
];
