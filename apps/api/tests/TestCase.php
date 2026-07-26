<?php

namespace Tests;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    /**
     * Several suites freeze time (Carbon::setTestNow()) to control
     * scanned_at/reminder-threshold/license-expiry boundaries — reset
     * unconditionally after every test so a frozen clock never leaks into
     * an unrelated test that happens to run next.
     */
    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    /**
     * RefreshDatabase migrates fresh and wraps every test in a rolled-back
     * transaction — against the wrong database that would mean silently
     * wiping/migrating real data. Real Postgres is required here (Prompt
     * 46 — this app relies on features like the partial unique index on
     * is_primary_contact that SQLite doesn't correctly exercise), so
     * there's no separate in-memory driver to lean on as a safety net;
     * this explicit name check is the safety net instead. Fails loudly
     * before a single migration runs if .env.testing is ever misconfigured
     * to point at anything other than the dedicated test database.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $connection = config('database.default');
        $database = config("database.connections.{$connection}.database");

        if ($connection !== 'pgsql' || ! str_ends_with($database, '_test')) {
            throw new RuntimeException(
                "Refusing to run tests against database '{$database}' on connection "
                ."'{$connection}' — expected a pgsql connection to a database name "
                ."ending in '_test'. Check .env.testing and phpunit.xml.",
            );
        }
    }
}
