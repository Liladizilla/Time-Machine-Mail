# Security Policy

## Supported versions

Security fixes are currently targeted at the latest code on the `main` branch. This is an early-stage prototype, not a production email service.

## Reporting a vulnerability

Please do not publish exploit details or sensitive data in a public issue. Use GitHub's **Report a vulnerability** option in the repository's Security tab to privately disclose suspected vulnerabilities. Include the affected path, impact, and safe reproduction steps. Please allow time for investigation before public disclosure.

## Data and secrets

- Never commit `.env.local`, provider credentials, service-role keys, access tokens, or real user message data.
- Only the Supabase public anon/publishable key belongs in `NEXT_PUBLIC_SUPABASE_ANON_KEY`; protect data with Row Level Security.
- Never expose a Supabase service-role key to client code.
- Timeline dates are presentation metadata and must not be represented as proof of historical email delivery.
- The database migration includes per-user RLS policies, but those policies must be integration-tested in a real Supabase project before production use.
