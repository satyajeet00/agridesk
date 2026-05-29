# ADR 0001 — Spring Boot 3 over Node.js for the backend

**Status:** Accepted
**Date:** 2026-05

## Context

The original AgriDesk prototype shipped on a Node.js + Next.js fullstack
stack. After the MVP was usable, I considered three options for the
production rewrite:

1. Keep Node.js (Express or NestJS) on a Next.js fullstack
2. Rewrite the backend in Spring Boot 3, keep Next.js as the SPA
3. Stay on the original codebase

## Decision

Rewrote the backend in **Spring Boot 3.3.5 + Java 17**, kept Next.js as the
frontend (now `agridesk-web`), kept the original as `agridesk/` for
reference.

## Reasons

- **Hireability.** Spring + Postgres is the most common production stack
  in India's Tier-1 SaaS / fintech sector. Building AgriDesk in it doubles
  as portfolio prep for backend roles.
- **Type system depth.** Records, sealed interfaces, generics, and bean
  validation make request/response DTOs and ledger math safer than the
  same code in JavaScript.
- **Transactional integrity.** `@Transactional` and Spring's exception
  unwrapping handle the bill-creation atomic write (stock decrement +
  farmer balance update + bill insert) more cleanly than any Node ORM I'm
  familiar with.
- **Tooling.** Spring Boot Actuator, JaCoCo, Springdoc OpenAPI, MockMvc —
  all production-grade defaults that would require assembling 5+ separate
  libraries in Node.

## Consequences

- Two languages in the repo (Java backend + TypeScript frontend) — but
  no shared code between them anyway, so the cost is real but small.
- Cold-start time on Render free tier is ~30 seconds vs ~3 seconds for Node.
  Acceptable for a paid SaaS; the first paying dealer pays for an
  always-warm Starter instance.
- The legacy Next.js fullstack code in `agridesk/` is untouched and can
  be referenced for design decisions but is not part of the production
  deployment.
