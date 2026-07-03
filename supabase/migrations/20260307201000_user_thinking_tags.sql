-- Cache AI-generated thinking tags on user profiles.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS thinking_tags_json JSONB,
  ADD COLUMN IF NOT EXISTS thinking_tags_updated_at TIMESTAMPTZ;
