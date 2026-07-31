# Product

## Register

product

> Default is `product` — the bulk of the codebase is app UI (`(worker)`, `(employer)`, `(companion)` route groups: dashboards, forms, wizards, print views).
> **Override to `brand` for the `(public)` route group** (`/`, `/lowongan`, `/cara-kerja`, `/verify/*`): those are read-by-strangers surfaces where design carries the argument.

## Users

Four audiences, defined in `CONTEXT.md` (canonical vocabulary — use those Indonesian terms in UI copy, never the English equivalents):

- **Pekerja** — informal worker (tukang bangunan, ART, teknisi). Primary user. Context: cheap Android phone, small screen, often outdoors, one hand free, data-conscious, variable literacy. Job to be done: turn spoken experience into portable proof of competence.
- **Pemberi Kerja** — a household, warung, or small contractor hiring one or two people. Not an HR department. Context: phone or laptop, hiring under time pressure, wants to know "can I trust this person".
- **Pendamping** — kelurahan staff / karang taruna who registers a Pekerja that has no smartphone. Context: desktop or shared tablet, doing several registrations in a sitting.
- **Publik** — a stranger who scanned a QR on a printed Kartu Kerja. No account, no context, five seconds of patience. Must understand what they are looking at without being taught.

## Product Purpose

Kita Kerja converts a worker's spoken experience into a **Kartu Kerja** — a printable, QR-verifiable work credential — so that reputation stops resetting to zero every time the worker moves.

Success: a Pekerja finishes Ngobrol Kerja and holds a card a stranger can verify; a Pemberi Kerja hires from evidence instead of a guess.

Built for Web Development Competition, Veternity Beraksi 2026. Judges are part of the audience: the public surfaces have to argue the thesis on their own.

## Brand Personality

**Grounded, plainspoken, evidentiary.**

Voice: the way a good kelurahan officer explains something — direct, unhurried, no jargon, no condescension. Indonesian throughout, everyday register, never corporate.

The interface should feel like a **document, not an app**: something printed, stamped, filed, and produced when asked. Emotional goal is dignity and proof, not aspiration or hustle. Never imply the worker is deficient — the product's premise is the worker already has the experience and only lacks paper.

Claims are always qualified by evidence. Trust layers (Terverifikasi / Dinilai / Diklaim) are shown honestly; nothing is dressed up as verified when it is not. Saringan Aman flags patterns, never declares fraud. AI never touches wage numbers (Upah Terang is deterministic, UMK-based).

## Anti-references

- **Gig-economy hustle marketing** — gradient heroes, "unlock your potential", stock smiling office people. Wrong class, wrong promise.
- **Enterprise HR / ATS software** — Workday, Jobstreet, LinkedIn recruiter UI. Density and jargon aimed at HR departments; our Pemberi Kerja is a household.
- **SaaS landing-page template** — big-number hero metric strip, identical three-icon card grid, tiny tracked uppercase eyebrow above every section, glassmorphism.
- **Charity / NGO framing** — soft-focus photos of "the poor", pity register. Workers are professionals, not beneficiaries.
- **Cold-gray dashboards.** The neutral ramp is warm (Tanah) on purpose.

## Design Principles

1. **The page is a document.** Ledger rules, hairline separators, asymmetric columns, printed-photo framing. Stacked drop-shadow cards are the fallback, not the language.
2. **Evidence over assertion.** Every claim on screen names its source: which job, which rating, which layer. The card is the argument.
3. **Comprehensible in five seconds by a stranger.** `/verify` and `/lowongan` are read by people with no onboarding and no account.
4. **Legible under bad conditions.** Large body type (17px base), high contrast, 48px touch minimums, no motion required to understand anything, prints correctly on A5.
5. **Nothing is gated that does not need to be.** A visitor can see a real Kartu Kerja and browse real lowongan without an account. Login is required to act, not to look.

## Accessibility & Inclusion

- Target **WCAG 2.2 AA**. Body text ≥4.5:1 on its background; the muted `tanah-500` is display-only, never body copy on `tanah-50`.
- Touch targets ≥48px (`--touch-min`); primary CTAs 56px (`--cta-height`).
- Every animation needs a `prefers-reduced-motion: reduce` alternative; tokens already expose `--motion-enabled`.
- Never encode meaning in color alone — trust layers carry a label as well as a tint.
- Voice-first flows always keep a manual text path.
- Assume small viewports and slow networks: 360px is a real device width, not an edge case.
