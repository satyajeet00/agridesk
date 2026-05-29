# ADR 0003 — JWT in localStorage, not server-side sessions or HTTP-only cookies

**Status:** Accepted
**Date:** 2026-05

## Context

Three credible options for browser → API authentication:

1. **Server-side sessions** — Spring Session backed by Redis, browser holds
   only an opaque session ID in a cookie
2. **HTTP-only secure cookies** holding the JWT — server still issues a
   JWT but it lives in a cookie the JS can't read
3. **JWT in `localStorage`** — frontend reads it, attaches it to
   `Authorization: Bearer <token>` headers

## Decision

JWT in `localStorage`, key `agridesk.session`, attached by the custom
`api` client in `src/lib/api.ts`. 7-day expiry, no refresh token.

## Reasons

- **No server-side state.** AgriDesk's API instance count can scale up and
  down on Render without any session-store coordination. Cheaper, simpler.
- **CORS simplicity.** Bearer tokens with `Authorization` headers are
  straightforward; cookie-based auth requires `SameSite`, `Secure`,
  `withCredentials`, and CSRF protection that we don't need for a same-
  organization SPA.
- **Frontend simplicity.** Reading the session from `localStorage` makes
  the layout's "redirect to /login if no session" check trivial and
  synchronous, no `useEffect`-with-await dance.
- **Token revocation isn't a v1 problem.** With a 7-day expiry and a
  closed beta of 5 dealers, there's no realistic threat model where I
  need server-side blacklisting. When that becomes a problem (>50
  dealers), I'll add a `tokenVersion` column on the User and bump it on
  password change.

## Consequences

- **XSS = full session compromise.** If anyone injects JS into the SPA,
  they get the token. Mitigations: React's escape-by-default, no
  `dangerouslySetInnerHTML`, no third-party scripts on the dashboard
  routes, CSP headers in production.
- 7-day sessions feel short on web but are reasonable for a B2B tool
  where dealers actively use the app daily.
- No "log out everywhere" feature in v1.
- Refresh tokens are on the roadmap (HLD §17) but blocked behind much
  bigger items.
