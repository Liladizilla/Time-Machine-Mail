# Time Machine Mail · v0.1

A web app prototype for arranging personal message entries by a chosen historical date. The selected `timeline_at` controls display order; `created_at` records when the database entry was actually created. The app does **not** claim that a message was sent or delivered on the historical date.

## What's implemented

1. Next.js + TypeScript app foundation and responsive inbox UI.
2. Supabase email/password sign-up and sign-in client flow.
3. PostgreSQL `messages` schema with per-user Row Level Security (RLS).
4. Compose form with a historical date/time, draft flag, validation, and database save for authenticated users.
5. Case-insensitive search and oldest/newest timeline ordering, with automated unit tests.

The app displays sample messages when Supabase is not configured so the interface is inspectable. Preview entries are only in browser memory and are not cloud-saved. A configured account is required for persistent, private messages.

## Run locally

Requirements: Node.js 20+ and a Supabase project.

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase project URL and publishable/anon key
npm test
npm run dev
```

Open `http://localhost:3000`.

## Supabase setup

1. Create a project in [Supabase](https://supabase.com/).
2. In **SQL Editor**, run `supabase/migrations/202610200001_initial_schema.sql`.
3. Copy the project URL and public anon/publishable key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Configure **Authentication → URL Configuration** with your local site URL `http://localhost:3000` and your deployed URL when available.
5. For early testing, set email confirmation policy intentionally in Supabase Auth. Production deployments should retain appropriate email confirmation and rate limits.

Never put a Supabase service-role key in a `NEXT_PUBLIC_*` variable or client code. RLS policies restrict all message operations to `auth.uid() = user_id`.

## Tests

`npm test` runs Node's built-in test runner against pure timeline helpers. It covers newest/oldest sorting, search across fields, blank search, compose validation, and historical timestamps. The SQL RLS policies are included in the migration but still require integration testing against a live Supabase project before production use.

## Known v0.1 limits

- No email is actually transmitted; `Save entry` creates a private timeline record.
- Drafts are stored as entries with status `draft`; a dedicated drafts view is future work.
- Sample entries are fictional preview data.
- The Google Fonts import is optional; local system fallbacks are defined.
