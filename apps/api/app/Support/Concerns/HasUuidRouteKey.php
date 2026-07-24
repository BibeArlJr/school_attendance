<?php

namespace App\Support\Concerns;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Str;

/**
 * Route-facing identity for a model whose internal auto-increment `id`
 * should never appear in a URL — students/staff/parent_guardians/classes
 * all use this identically (Prompt 16). `id` stays untouched for FKs and
 * joins; this only changes what implicit route-model binding matches on
 * and what a `{model}` route parameter resolves.
 */
trait HasUuidRouteKey
{
    protected static function bootHasUuidRouteKey(): void
    {
        static::creating(function ($model) {
            if (! $model->uuid) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * `uuid` is a real Postgres uuid column — a non-UUID-shaped value
     * (e.g. an old-style numeric id) makes the underlying query throw an
     * "invalid input syntax for type uuid" error rather than simply
     * finding no match, which would otherwise surface as an unhandled
     * 500 instead of the plain 404 a not-found route should give. Reject
     * anything that isn't UUID-shaped before it ever reaches the query.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        if (! Str::isUuid((string) $value)) {
            throw (new ModelNotFoundException())->setModel(static::class, [$value]);
        }

        return parent::resolveRouteBinding($value, $field);
    }
}
