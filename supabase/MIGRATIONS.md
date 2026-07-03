# Supabase migrations

Apply all migrations **in timestamp order** via Supabase SQL Editor or `supabase db push`.

## Checklist (21 files)

| # | File | Unlocks |
|---|------|---------|
| 1 | `20260307190300_initial_schema.sql` | Core tables, auth trigger, RLS |
| 2 | `20260307190700_questions_public_read_and_seed.sql` | Public question read, initial seed |
| 3 | `20260307191000_responses_answer_before_reveal.sql` | Answer-before-reveal RLS |
| 4 | `20260307191300_fix_responses_rls_recursion.sql` | `user_has_answered_question()` |
| 5 | `20260307191500_backfill_users_and_ensure_profile.sql` | Profile backfill, `ensure_current_user_profile()` |
| 6 | `20260307192000_follow_system.sql` | Follow graph, anon user read |
| 7 | `20260307192500_question_insights_upsert.sql` | Insight caching RPC |
| 8 | `20260307193000_seed_curated_questions.sql` | +100 curated questions |
| 9 | `20260307193500_feed_social_stats.sql` | `get_feed_social_stats()` |
| 10 | `20260307194000_mind_match_profile_stats.sql` | `get_user_thinking_stats()` |
| 11 | `20260307194500_question_insights_anon_read.sql` | Feed anti-echo insight reads |
| 12 | `20260307195000_social_engagement_and_scoring.sql` | Upvotes, reactions, replies, canonical answers |
| 13 | `20260307195500_seed_discourse_questions.sql` | +100 discourse questions |
| 14 | `20260307196000_private_response_messages.sql` | Private notes, `get_shared_question_link()` |
| 15 | `20260307197000_profile_bio.sql` | Profile bio column |
| 16 | `20260307198000_reaction_counts.sql` | Reaction count RPC |
| 17 | `20260307199000_submission_moderation.sql` | Question status, moderation |
| 18 | `20260307200000_avatars_storage.sql` | Avatars storage bucket |
| 19 | `20260307201000_user_thinking_tags.sql` | AI thinking tags cache |
| 20 | `20260307202000_seed_more_questions.sql` | +50 questions |
| 21 | `20260307203000_sync_upvote_counts.sql` | Reset fake seed upvotes to real counts |

## Verify RPCs exist

Run in SQL Editor after applying migrations:

```sql
SELECT proname FROM pg_proc
WHERE proname IN (
  'user_has_answered_question',
  'ensure_current_user_profile',
  'get_user_response_count',
  'get_feed_social_stats',
  'get_user_thinking_stats',
  'toggle_question_upvote',
  'upsert_question_insight',
  'get_shared_question_link',
  'get_response_reaction_counts'
)
ORDER BY proname;
```

## Verify tables exist

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'questions', 'responses', 'friendships',
    'question_insights', 'question_upvotes',
    'response_reactions', 'response_replies',
    'response_private_messages'
  )
ORDER BY tablename;
```

## Backfill insights (optional)

After migrations and once questions have 2+ responses:

```bash
npx tsx scripts/backfill-insights.ts
```

Requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (service role bypasses RLS for batch writes).
