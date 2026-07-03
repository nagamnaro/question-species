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

Copy values from your local `.env.local` (never commit that file).

`SUPABASE_SERVICE_ROLE_KEY` is **not** required on Vercel unless you run backfill scripts in CI. Skip for friend testing.

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
| `users.bio does not exist` | Run migrations in `supabase/MIGRATIONS.md` order |
| Slow feed | Production deploy + EU Supabase region |
