# Time Machine Mail · v0.1

[![CI](https://github.com/Liladizilla/Time-Machine-Mail/actions/workflows/ci.yml/badge.svg)](https://github.com/Liladizilla/Time-Machine-Mail/actions/workflows/ci.yml)

A web app prototype for arranging personal message entries by a chosen historical date. The selected `timeline_at` controls display order; `created_at` records when the database entry was actually created. The app does **not** claim that a message was sent or delivered on the historical date.

## What's implemented

- Next.js + TypeScript application with a responsive timeline inbox.
- Supabase email/password sign-up, sign-in, and password-recovery flows.
- PostgreSQL `messages` schema with per-user Row Level Security (RLS).
- Compose form with a selected timeline date/time, draft flag, validation, and database save for authenticated users.
- Drafts folder, plus edit and delete actions for timeline entries.
- Case-insensitive search and oldest/newest timeline ordering.
- Automated Node.js tests plus GitHub Actions checks for tests, linting, and production build.
- Dependabot configuration for npm packages and GitHub Actions dependencies.

The app displays fictional sample messages when Supabase is not configured so the interface is inspectable. Preview entries are only in browser memory and are not cloud-saved. A configured account is required for persistent, private messages.

## Run locally

Requirements: Node.js 22 recommended and a Supabase project.

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase project URL and public anon/publishable key
npm test
npm run lint
npm run dev
```

Open `http://localhost:3000`.

## Supabase setup

1. Create a project in [Supabase](https://supabase.com/).
2. In **SQL Editor**, run `supabase/migrations/202610200001_initial_schema.sql`.
3. Copy the project URL and public anon/publishable key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Configure **Authentication → URL Configuration** with your local site URL `http://localhost:3000` and your deployed URL when available. Add `http://localhost:3000/reset-password` and the matching deployed `/reset-password` URL to the allowed redirect URLs, or password-reset emails will not return to the app.
5. Set your email confirmation policy deliberately in Supabase Auth. Production should use suitable email confirmation, rate limits, and recovery settings.

Never put a Supabase service-role key in a `NEXT_PUBLIC_*` variable or client code. RLS policies restrict message operations to `auth.uid() = user_id`.

## Tests and CI

`npm test` runs Node's built-in test runner against pure timeline helpers. It covers newest/oldest sorting, search across fields, blank search, compose validation, malformed email addresses, and invalid dates. GitHub Actions runs the test suite, ESLint, and a production build on pushes and pull requests targeting `main`.

The SQL RLS policies are included in the migration but still require integration testing against a live Supabase project before production use.

## Known v0.1 limits

- **No email is sent.** Saving a message creates a private timeline record, not an outbound email.
- The chosen date is a timeline/display date, not a sent or delivered timestamp.
- Drafts are stored as entries with status `draft`; the drafts folder is available, but drafts are not sent as email.
- Preview entries are fictional and are not persisted.
- Google Fonts are optional; system font fallbacks are defined.
- A dependency lockfile and end-to-end browser tests remain to be added before a production release.
- Password recovery requires the `/reset-password` redirect to be allowed in Supabase Auth URL Configuration and has not yet been verified against a live project.

## Roadmap

1. Finish auth/session and database integration tests against Supabase.
2. Add pagination and server-backed search for large timelines.
3. Add end-to-end tests for sign-in, password recovery, private records, and composing historical entries.
4. If real email sending is added, keep actual provider timestamps separate from user-selected timeline dates and clearly disclose the distinction.

See [SECURITY.md](SECURITY.md) for the security policy.
