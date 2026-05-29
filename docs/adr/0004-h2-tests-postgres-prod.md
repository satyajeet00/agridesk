# ADR 0004 — H2 in tests, PostgreSQL in production

**Status:** Accepted
**Date:** 2026-05

## Context

Spring Boot's default test profile spins up H2 in-memory. Production runs
on PostgreSQL 16. Two common alternatives:

1. **Testcontainers** — run a real Postgres in a Docker container for
   every test class
2. **H2 for everything** including production — fast, in-process, no ops

## Decision

- **Tests**: H2 in-memory, `mode=PostgreSQL` for syntax compatibility,
  `ddl-auto=create-drop`, fresh per `@SpringBootTest` class.
- **Local dev**: H2 file-based at `./data/agridesk` so refreshes between
  runs feel "real" but no external service is needed.
- **Production**: PostgreSQL 16 managed by Render/Neon/Supabase.

## Reasons

- **Test speed.** The 75-test backend suite finishes in ~70 seconds on H2.
  Testcontainers would add ~20 seconds per test class for container
  startup; CI would hit Render's 25-min e2e limit.
- **Local dev friction.** Asking every contributor to install and run
  Postgres is a barrier. H2's `jdbc:h2:file:` URL with no installed
  service Just Works.
- **Production correctness.** All JPA queries use HQL/JPQL or standard
  SQL; no Postgres-specific extensions (jsonb, arrays, full-text search)
  are used in v1. The e2e CI workflow (`e2e.yml`) DOES run against a
  real Postgres-16 service container, so any drift is caught nightly.

## Consequences

- A new Postgres-only feature (e.g. jsonb columns) would silently break
  tests because H2 wouldn't fail in the same way. Mitigation: any
  Postgres-only feature must be added behind a Testcontainers test.
- The e2e workflow's nightly Postgres run is the ground truth.
- Migration discipline (Flyway, see HLD §17) becomes more important —
  schema drift between H2 and Postgres would be invisible until prod.
