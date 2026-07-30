# Kita Kerja

Informal job portal & local network service — Web Development Competition, Veternity Beraksi 2026. Full build spec: `PROMPT_KITA_KERJA.md`.

Stack: Next.js 15 (App Router, TypeScript), Tailwind CSS v4, shadcn/ui, Supabase (Postgres + Auth + Storage), Gemini API (server-side only), Zod.

## Agent skills

### Issue tracker

Issues live in GitHub Issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — `CONTEXT.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.
