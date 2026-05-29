# AgriDesk — 90-second Loom demo script

Aimed at a hiring manager scanning your GitHub. Hits product clarity,
technical depth, and shipping discipline in 90 seconds.

**Recording setup**
- Use Loom (free tier, 5-min cap is fine).
- 1080p, webcam bubble bottom-right.
- Browser: a clean Chrome window, no other tabs.
- Have both servers running before recording:
  - `agridesk-api` on `http://127.0.0.1:8080`
  - `agridesk-web` on `http://127.0.0.1:5501`
- Have a fresh dealer signed up with 2-3 farmers, 1-2 products, and 1 bill
  with a partially-paid balance — so the dashboard isn't empty.

---

## Beat 1 — Hook (0:00 - 0:10)

> "Hi, I'm Satyajeet. This is AgriDesk — a Hindi-first SaaS for India's
> 4 million agri-input dealers, who still track farmer credit in paper
> diaries. ₹499 a month, flat."

**Show:** Landing on `http://127.0.0.1:5501` (login page in Hindi).

---

## Beat 2 — The problem in 10 seconds (0:10 - 0:20)

> "A typical fertilizer shop extends 1 to 5 lakh rupees of informal credit
> a month. Lose the diary, lose the money. Existing software is in
> English, made for accountants. So I built one for the dealer himself."

**Show:** Quick zoom on the Hindi UI.

---

## Beat 3 — Core workflow (0:20 - 0:55)

> "Here's the daily flow. The dealer sees outstanding credit per farmer
> ranked by amount owed."

**Show:** Dashboard — point at "बकाया उधारी" and the top-debtors list.

> "One tap to add a credit entry…"

**Show:** Farmers page → click a farmer → Add Credit → enter ₹500 → save.

> "…and one tap to send a WhatsApp reminder."

**Show:** Click the WhatsApp icon → the wa.me link opens with a Hindi message.

> "Bills run in a single transaction — stock decrements, the farmer's
> balance updates, and the bill number is assigned sequentially per
> dealer. PDF and WhatsApp share are one tap each."

**Show:** Billing page → create a new bill with two items, one credit
amount → save → PDF download → share button.

---

## Beat 4 — The architecture (0:55 - 1:20)

**Show:** Switch to GitHub README, scroll to the architecture mermaid
diagram.

> "Backend is Spring Boot 3 with Java 17. Frontend is Next.js 16.
> Postgres in production, H2 in dev. Multi-tenancy is enforced at the
> service layer — every query is scoped to the dealer ID embedded in
> the JWT. There's a JUnit test that proves dealer A can't read dealer
> B's data, even with a tampered request."

**Show:** Open `docs/HLD.md` for one second, scroll past the ERD and
the multi-tenancy section. Don't read.

> "I also wrote 24 Playwright UI tests, a 75-test backend suite with
> 88% coverage, and a live-stack PowerShell smoke test. All three run
> in CI."

**Show:** GitHub Actions tab → green CI run.

---

## Beat 5 — Close (1:20 - 1:30)

> "It's MIT-licensed, the full HLD, ADRs, and Swagger UI are linked
> from the README. Code's at github.com/satyajeet00/agridesk. Happy
> to walk through any part of it."

**Show:** GitHub repo home with green CI badge.

---

## Tips

- **Don't read this script verbatim.** Talking faster than you'd normally
  speak adds urgency; reading sounds rehearsed.
- **Keep the cursor still** when you're talking, move it only when you
  want the viewer's eye to move.
- **Re-record beat 3 until the bill creation flow is smooth** — that's
  the technical highlight (atomic transaction visible as one click).
- **Embed the Loom URL in `README.md`** under the *Live demo* section
  after the upload.
