# ADR 0005 — Modular monorepo, not microservices

**Status:** Accepted
**Date:** 2026-05

## Context

Three architectures were on the table for AgriDesk:

1. **Modular monolith** — single Spring Boot service with controller →
   service → repository layers, one deployable artifact
2. **Microservices** — split by domain: AuthService, BillingService,
   InventoryService, PaymentService
3. **Serverless functions** — one Lambda / Cloud Function per endpoint

## Decision

Modular monolith. One `agridesk-api` Spring Boot deployable. The 8
domains (auth, dashboard, farmers, inventory, bills, ledger, settings,
payment) are clearly separated by package and controller, with no
cross-domain repository access.

## Reasons

- **Team size.** Solo founder. Microservices' main payoff is letting
  separate teams own separate services; with one engineer that's pure
  overhead — distributed transactions, inter-service auth, multi-repo
  CI, deployment orchestration.
- **Domain coupling.** Bills atomically read products + write stock +
  write ledger + write farmer balance. In a microservices world that's
  a saga with compensating actions. In a monolith it's one
  `@Transactional` method (`BillService.create`).
- **Cost.** One Render Web Service ($7/mo) beats one-per-microservice.
- **Hireability.** Senior interviewers prefer engineers who can explain
  *why they chose not to* go microservices over engineers who default
  to it. This is the right answer for a single-DB B2B SaaS targeting
  thousands of tenants, not millions of users.

## Consequences

- A bug or memory leak in any domain affects the whole API. Mitigation:
  Spring's per-request thread-local state, plus Sentry / structured
  logging in roadmap to catch regressions early.
- If AgriDesk ever needs language polyglot (e.g. Python ML for stock
  forecasting), that becomes its own service later — the existing API
  doesn't need to change.
- The monorepo houses both `agridesk-api` (Java) and `agridesk-web`
  (TypeScript). They share no code but share CI, Dependabot, and a
  single README — recruiters click ONE link and see the whole system.
