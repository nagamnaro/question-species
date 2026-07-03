# Deploy Question Species for friends

## Prerequisites

- [GitHub](https://github.com) account
- [Vercel](https://vercel.com) account (sign in with GitHub)
- Supabase project already set up with migrations applied

---

## 1. Push to GitHub

From this folder in a terminal:

```powershell
cd "C:\Users\oranm\OneDrive - Imperial College London\Question Species"
git add .
git status
git commit -m "Initial commit: Question Species MVP for friend testing"
```

Create a **new empty repo** on GitHub (do not add README/license):

1. Go to [github.com/new](https://github.com/new)
2. Name it e.g. `question-species`
3. Keep it **Private** or **Public** (your choice)
4. Click **Create repository**

Then connect and push (replace `YOUR_USERNAME`):

```powershell
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/question-species.git
git push -u origin main
```

If using GitHub CLI after install:

```powershell
gh auth login
gh repo create question-species --private --source=. --remote=origin --push
```

---

## 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import** your `question-species` GitHub repo
3. Framework preset: **Next.js** (auto-detected)
4. Root directory: `.` (default)
5. **Do not deploy yet** — add environment variables first (step 3)

---

## 3. Environment variables on Vercel

In Vercel → your project → **Settings** → **Environment Variables**, add:

| Name | Value | Environments |
|------|--------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase → Settings → API → Project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase → Settings → API → `anon` `public` | Production, Preview, Development |
| `GROQ_API_KEY` | From [console.groq.com](https://console.groq.com) (optional; insights fall back without it) | Production, Preview |
| `GROQ_MODEL` | `llama-3.1-8b-instant` | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` (server-only; enables reliable magic-link email) | Production |
| `RESEND_API_KEY` | From [resend.com](https://resend.com) (optional; bypasses Supabase 2/hr email cap) | Production |
| `RESEND_FROM_EMAIL` | e.g. `Question Species <auth@yourdomain.com>` (must be a verified sender in Resend) | Production |

Copy values from your local `.env.local` (never commit that file).

`SUPABASE_SERVICE_ROLE_KEY` + `RESEND_*` together send magic links via Resend instead of Supabase’s built-in mail (which is capped at **2 emails per hour** for the whole project). Alternatively, configure custom SMTP in Supabase (step 4b) and skip Resend env vars.

Click **Deploy**.

---

## 4. Supabase auth (required for login)

After the first Vercel deploy, copy your live URL (e.g. `https://question-species.vercel.app`).

In **Supabase Dashboard** → **Authentication** → **URL Configuration**:

| Field | Value |
|-------|--------|
| **Site URL** | `https://YOUR-APP.vercel.app` |
| **Redirect URLs** | `https://YOUR-APP.vercel.app/**` |
| | `http://localhost:3000/**` (keep for local dev) |

Save. Magic-link sign-in will not work until this is set.

### 4b. Fix “email rate limit exceeded” (required for friends)

Supabase’s **built-in email** allows only **~2 magic links per hour for the entire app**. After that, everyone sees `email rate limit exceeded`.

Pick **one** of these fixes:

**Option A — Google sign-in (fastest for friends)**

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → **Create OAuth client** (Web application).
2. Authorized redirect URI: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback` (find project ref in Supabase URL).
3. Supabase → **Authentication** → **Providers** → **Google** → enable, paste Client ID + Secret.
4. Friends use **Continue with Google** on `/login` (no email quota).

**Option B — Custom SMTP in Supabase (keeps email magic links)**

1. Create a free account at [resend.com](https://resend.com) (or SendGrid, etc.).
2. Verify a domain (or use Resend’s test domain while testing alone).
3. Supabase → **Authentication** → **SMTP Settings** → enable custom SMTP.
4. Resend SMTP: host `smtp.resend.com`, port `465`, user `resend`, password = your Resend API key.
5. Supabase → **Authentication** → **Rate Limits** → raise **Email sent** (e.g. 30/hour).

**Option C — Resend from the app (already wired in code)**

Add to Vercel env vars:

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (verified sender, e.g. `Question Species <auth@yourdomain.com>`)

The app generates magic links server-side and sends them through Resend, avoiding Supabase’s 2/hr cap.

---

## 5. Supabase region (latency)

**Project Settings** → **General** → prefer **West EU (London)** if your friends are in the UK.

---

## 6. Share with friends

Send them:

- **App URL:** `https://YOUR-APP.vercel.app`
- **Sign in:** email magic link on `/login`
- Remind them to check spam for the Supabase email

---

## 7. Verify production build locally (optional)

```powershell
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) — should feel faster than `npm run dev`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on Vercel | Check **Deployments** → failed build → **Logs** |
| "Invalid API key" | Re-copy `NEXT_PUBLIC_*` vars; redeploy |
| Magic link goes nowhere | Add Vercel URL to Supabase redirect URLs |
| `email rate limit exceeded` | Built-in Supabase email is ~2/hr for the whole app — see **§4b** (Google, custom SMTP, or Resend env vars) |
| `users.bio does not exist` | Run migrations in `supabase/MIGRATIONS.md` order |
| Slow feed | Production deploy + EU Supabase region |
