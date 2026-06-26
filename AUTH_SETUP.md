# Authentication Setup (Supabase + Vercel)

The app now uses **Supabase Auth** with two roles — `member` and `admin`.
Accounts are **invite-only**; admins invite people, members set their own
availability, admins get the full team-management tool.

This is a one-time setup. Code is already wired up; you just provide the project.

## 1. Create the Supabase project

1. Go to https://supabase.com → **New project** (free tier is fine).
2. Once created, open **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key
   - **service_role** key (secret — server only, never in the browser)

## 2. Create the database schema

Open **SQL Editor** in Supabase, paste the contents of
[`supabase/migrations/0001_auth_and_availability.sql`](supabase/migrations/0001_auth_and_availability.sql),
and run it. This creates the `profiles` and `availability` tables, the
auto-profile trigger, and all Row-Level-Security policies.

## 3. Configure Auth

In **Authentication → Providers → Email**: make sure **Email** is enabled
(this powers both password and magic-link sign-in).

In **Authentication → Sign In / Providers** (or **Settings**):
- **Disable "Allow new users to sign up"** → makes it invite-only.

In **Authentication → URL Configuration**:
- **Site URL**: your production URL (e.g. `https://falcons.vercel.app`).
- **Redirect URLs**: add `https://<your-domain>/auth/callback` and,
  for local dev, `http://localhost:8080/auth/callback`.

## 4. Environment variables

### Local (`frontend/.env.local`) — copy from `frontend/.env.example`
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### Vercel (Project Settings → Environment Variables)
Add all of these (the `VITE_*` ones are public, the service role is secret):
```
VITE_SUPABASE_URL          = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY     = your-anon-public-key
SUPABASE_URL               = https://your-project.supabase.co
SUPABASE_ANON_KEY          = your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY  = your-service-role-secret
```
The `SUPABASE_*` (non-VITE) vars are used only by the serverless invite
function at `api/invite.js` and never reach the browser.

## 5. Create the first admin

The invite endpoint is admin-only, so you need one admin to bootstrap:

1. In Supabase → **Authentication → Users → Add user** (or invite yourself).
2. After the user exists, open **Table Editor → profiles**, find your row,
   and set `role` to `admin`.
3. Sign in at `/login`. You can now invite everyone else from
   **Admin → Members**.

## Testing locally

The Vite dev server serves the `/api/invite` function too (via a dev plugin in
`frontend/vite.config.ts`), so a single `npm run dev` exercises the whole flow —
no `vercel dev` needed.

1. Fill in **`frontend/.env.local`** (already scaffolded, gitignored):
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret
   ```
2. In Supabase → **Authentication → URL Configuration → Redirect URLs**, add
   `http://localhost:8080/auth/callback`.
3. Create your first admin (see step 5 above) so you can test inviting.
4. `cd frontend && npm run dev`, then open http://localhost:8080
   - `/login` — sign in with password or magic link
   - `/dashboard` — member view; set availability
   - `/admin/members` — invite someone (sends a real Supabase invite email)
   - `/admin/availability` — see member responses feed the Suggested XI

If `.env.local` is empty, the app loads and shows a "sign-in not configured"
banner instead of crashing.

## How it works

| Area | Route | Who |
|------|-------|-----|
| Sign in (password or magic link) | `/login` | anyone with an account |
| Invite / set-password landing | `/auth/callback` | invited users |
| Member dashboard + availability | `/dashboard` | any signed-in member |
| Team-management tool + Members admin | `/admin` | `role = admin` only |

- **Inviting**: Admin → Members → enter email, role, optional player link →
  the `api/invite` serverless function verifies the caller is an admin and
  sends a Supabase invite email.
- **Security**: roles and data access are enforced server-side by Postgres
  Row-Level Security — not just hidden in the UI. The old hardcoded
  `falcons2025` password is gone.

## Deployment note

Vercel is now the single deployment target. The old GitHub Pages workflow
(`.github/workflows/deploy.yml`) was removed; Vercel auto-deploys on every
push to `main` (including the daily CricHeroes data commit). The
`update-stats.yml` data scraper is unchanged.
