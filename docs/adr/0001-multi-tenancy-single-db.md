# ADR 0001: Single-Database, Shared-Schema Multi-Tenancy

## Status

Accepted

## Context

School ERP is sold as SaaS to many schools. Each school's data (students,
teachers, attendance, SMS logs, etc.) must be isolated from every other
school's data, while the product remains operable and affordable to run at
the scale of a single developer/small team maintaining it in Phase 1–13.

The alternatives considered were: (a) one database per tenant, (b) one
Postgres schema per tenant within a shared database, or (c) a single
database and schema shared by all tenants, with every tenant-scoped table
carrying a `school_id` foreign key.

## Decision

We use a single database, single schema, with row-level tenancy via a
`school_id` column on every tenant-scoped table (starting with `users` in
this phase). Query scoping is enforced at the application layer (Eloquent
global scopes / policies in later phases), not by infrastructure isolation.

## Rationale

A per-tenant database or schema gives the strongest isolation but multiplies
operational cost linearly with customer count: migrations must run N times,
connection pooling becomes a per-tenant concern, and cross-tenant reporting
(useful for the vendor's own analytics) requires fan-out queries across N
connections. For a Nepali school SaaS expected to onboard many small-to-
medium schools rather than a few enterprise accounts, single-DB shared-schema
keeps migrations, backups, and connection management O(1) instead of O(n),
at the cost of needing rigorous application-level scoping discipline (global
scopes, policies, and tests) to prevent cross-tenant data leaks. This
tradeoff is revisited if/when a customer requires dedicated infrastructure
for compliance reasons — at that point a single large tenant can be split
out without changing the schema shape, only the connection resolution.
