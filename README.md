# Question Species

Social curiosity app — answer questions, compare reasoning, discover how minds think.

## Local development

```bash
npm install
cp .env.local.example .env.local   # then fill in Supabase keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy for friends (GitHub + Vercel)

See **[DEPLOY.md](./DEPLOY.md)** for step-by-step: push to GitHub, import to Vercel, env vars, and Supabase auth URLs.

Quick checklist:

1. Push this repo to GitHub
2. Import on [vercel.com/new](https://vercel.com/new)
3. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, optional `GROQ_API_KEY`
4. Set Supabase **Site URL** + **Redirect URLs** to your Vercel domain

## Database

Apply migrations in order — see [supabase/MIGRATIONS.md](./supabase/MIGRATIONS.md).

