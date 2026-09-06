# Kita Kerja

Informal job portal & local network service — Web Development Competition, Veternity Beraksi 2026.

Ringkasan menyeluruh aplikasi (produk, peran, alur, rute, stack): [`docs/overview-aplikasi.md`](docs/overview-aplikasi.md).

## Live URL

Deployment skipped for now — run `npx vercel login`, then I can deploy and update this URL.

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- shadcn/ui
- Supabase (Postgres + Auth + Storage)
- Gemini API (server-side only)
- Zod

## Getting started

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Build

```bash
npm run build
```
