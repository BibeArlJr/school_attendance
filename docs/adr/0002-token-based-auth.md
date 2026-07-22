# ADR 0002: Token-Based Auth via Sanctum (Not SPA Cookie Flow)

## Status

Accepted

## Context

The web frontend and the Laravel API are separate applications on separate
origins/ports, and a Flutter mobile client is planned for a later phase.
Laravel Sanctum supports two distinct modes: (1) the SPA "stateful" cookie
flow, which relies on a shared top-level domain and `EnsureFrontendRequests
AreStateful` middleware plus CSRF cookies, and (2) classic personal access
tokens sent as `Authorization: Bearer <token>` headers.

## Decision

We use Sanctum personal access tokens (Bearer token flow) for all clients —
web and, later, mobile. `EnsureFrontendRequestsAreStateful` is intentionally
not configured, and no CSRF-cookie/session-cookie machinery is introduced.

## Rationale

The SPA cookie flow assumes a browser, first-party cookies, and same-site (or
carefully configured cross-site) cookie handling — none of which exist on a
mobile client. Choosing the stateful cookie flow now would mean building a
second, different auth mechanism for Flutter later, doubling the auth surface
to maintain and test. A single Bearer-token flow works identically for the
web SPA, the future mobile app, and any future third-party integration, at
the cost of the frontend being responsible for storing the token itself
(see the `localStorage` TODO in `authStore` for hardening this in Phase 13)
and losing automatic CSRF protection — acceptable since token-based APIs are
not vulnerable to CSRF in the way cookie-authenticated ones are.
