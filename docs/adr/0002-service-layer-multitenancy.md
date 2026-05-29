# ADR 0002 — Service-layer multi-tenancy, not schema-per-tenant

**Status:** Accepted
**Date:** 2026-05

## Context

AgriDesk is a multi-tenant SaaS — every dealer is one tenant, and dealer A
must never read, write, or even infer the existence of dealer B's data.
Three common shapes for this exist:

1. **Schema-per-tenant** — separate Postgres schema for each dealer
2. **Database-per-tenant** — separate Postgres database for each dealer
3. **Row-level tenancy** — single schema, every table has a `dealer_id`
   column, every query filters by it

## Decision

Row-level tenancy, enforced at the **service layer** via a
`CurrentUser.dealerId()` helper that reads from the authenticated
`SecurityContextHolder`. Every repository method takes the dealer ID
as a parameter — there is no "global find by id" anywhere in the codebase.

## Reasons

- **Cost.** Schema-per-tenant scales operations (migrations, backups,
  connection pools) by tenant count. With a target of 1,000+ dealers on
  a single small Postgres instance, that's a non-starter.
- **Simplicity.** Spring Data JPA + a single schema means stock JPA
  queries everywhere, no per-request schema switching.
- **Testability.** The `MultiTenantIsolationTest` proves the guarantee
  with a black-box JUnit test: dealer A's token cannot read or modify
  any of dealer B's farmers, products, bills, ledger entries, or staff.
  Adding a new module means adding one more isolation test, not
  duplicating schema infrastructure.

## Consequences

- A bug in *one* service method that forgets to filter by dealer ID is a
  cross-tenant data leak. Mitigation: `MultiTenantIsolationTest` covers
  every entity type the dealer can read or modify, and every new
  endpoint must add a test there.
- Future "noisy neighbor" — one dealer issuing 100k bills can slow others
  on the same DB. Acceptable until 200+ dealers; addressed later via
  connection-pool limits and per-tenant rate limiting (see HLD §17).
- Row-level security (Postgres RLS) is a defense-in-depth option for
  later, but not part of v1.
