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

## Preview without Vercel

### Browser preview in GitHub Codespaces

The repository includes a devcontainer that installs dependencies and starts the Next.js development server when the Codespace opens. GitHub forwards port `3000` and opens the browser preview automatically. Supabase is optional for UI preview; without credentials, the app uses fictional in-memory sample entries.

1. Open the [repository](https://github.com/Liladizilla/Time-Machine-Mail).
2. Select **Code → Codespaces → Create codespace on main**.
3. Wait for setup to finish. If the preview does not open automatically, open the **Ports** panel and visit port `3000`.

Codespaces availability and included usage depend on your GitHub account. Do not add secrets to the repository to make preview mode work.

### Run on your own computer

Requirements: Node.js 22 recommended. Supabase is optional for inspecting the interface and required for account-backed persistence.

```bash
npm ci
npm test
npm run lint
npm run dev
```

Open `http://localhost:3000`. To test real accounts and saved records, configure the Supabase variables described below in `.env.local`.

## Desktop app (Electron)

Time Machine Mail can run as a standalone desktop application. Electron opens a native window and starts the bundled Next.js standalone server locally; it does not depend on a Vercel deployment. The same UI and Supabase client are used in browser and desktop builds.

### Run the desktop app in development

Requirements: Node.js 22.12 or newer.

```bash
npm ci
npm run desktop:dev
```

This starts the Next.js development server and opens the Electron window. Stop it with `Ctrl+C`.

### Build an installer

Build installers on the matching operating system, or use the **Desktop installers** GitHub Actions workflow to build for Linux, Windows, and macOS in hosted runners.

```bash
npm run desktop:dist       # Linux: AppImage and .deb
npm run desktop:dist:win   # Windows: NSIS installer
npm run desktop:dist:mac   # macOS: .dmg
```

Build output is written to `release/`. Linux packages target x64 by default. Cross-platform installer jobs run from GitHub Actions; they do not require Vercel. Installer artifacts are attached to tagged desktop releases when a `desktop-v*` tag is pushed.

For desktop account sign-in and password recovery, add `http://127.0.0.1:43127/**` to Supabase Auth's allowed redirect URLs. The installed app reads optional runtime settings from `config.json` in its Electron user-data directory (on Linux this is normally `~/.config/time-machine-mail/config.json`; Windows and macOS use their standard app-data directories):

```json
{
  "supabaseUrl": "https://YOUR_PROJECT.supabase.co",
  "supabaseAnonKey": "YOUR_PUBLIC_ANON_KEY"
}
```

Restart the app after editing this file. The installer does not contain CI placeholder credentials. Only use the public anon/publishable key, never a Supabase service-role key.

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
- Browser-level end-to-end tests remain to be added before a production release.
- Password recovery requires the `/reset-password` redirect to be allowed in Supabase Auth URL Configuration and has not yet been verified against a live project.

## Roadmap

1. Add end-to-end tests for sign-in, password recovery, private records, and composing historical entries.
2. Verify auth/session and database isolation against a live Supabase project.
3. Add pagination and server-backed search for large timelines.
4. If real email sending is added, keep actual provider timestamps separate from user-selected timeline dates and clearly disclose the distinction.

See [SECURITY.md](SECURITY.md) for the security policy.
