-- Question Species: initial schema
-- Run via Supabase CLI (`supabase db push`) or SQL Editor in the dashboard.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.species AS ENUM (
  'puzzle',
  'opinion',
  'prediction',
  'estimation',
  'brainstorm'
);

CREATE TYPE public.friendship_status AS ENUM (
  'pending',
  'accepted',
  'blocked'
);

-- ---------------------------------------------------------------------------
-- Users (profiles linked to auth.users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  display_name TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON public.users (email);

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------

CREATE TABLE public.questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text        TEXT NOT NULL CHECK (char_length(trim(text)) > 0),
  species     public.species NOT NULL,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  created_by  UUID REFERENCES public.users (id) ON DELETE SET NULL,
  upvotes     INTEGER NOT NULL DEFAULT 0 CHECK (upvotes >= 0),
  difficulty  SMALLINT CHECK (difficulty IS NULL OR (difficulty >= 1 AND difficulty <= 5)),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_species ON public.questions (species);
CREATE INDEX idx_questions_created_by ON public.questions (created_by);
CREATE INDEX idx_questions_created_at ON public.questions (created_at DESC);

-- ---------------------------------------------------------------------------
-- Responses
-- ---------------------------------------------------------------------------

CREATE TABLE public.responses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  question_id      UUID NOT NULL REFERENCES public.questions (id) ON DELETE CASCADE,
  answer_text      TEXT NOT NULL CHECK (char_length(trim(answer_text)) > 0),
  reasoning_text   TEXT,
  prediction_value NUMERIC,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT responses_user_question_unique UNIQUE (user_id, question_id)
);

CREATE INDEX idx_responses_question_id ON public.responses (question_id);
CREATE INDEX idx_responses_user_id ON public.responses (user_id);
CREATE INDEX idx_responses_created_at ON public.responses (created_at DESC);

-- ---------------------------------------------------------------------------
-- Friendships
-- ---------------------------------------------------------------------------

CREATE TABLE public.friendships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  friend_id   UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  status      public.friendship_status NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT friendships_no_self CHECK (user_id <> friend_id),
  CONSTRAINT friendships_pair_unique UNIQUE (user_id, friend_id)
);

CREATE INDEX idx_friendships_user_id ON public.friendships (user_id);
CREATE INDEX idx_friendships_friend_id ON public.friendships (friend_id);
CREATE INDEX idx_friendships_status ON public.friendships (status);

-- ---------------------------------------------------------------------------
-- Question insights (AI-generated summaries, populated later)
-- ---------------------------------------------------------------------------

CREATE TABLE public.question_insights (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   UUID NOT NULL UNIQUE REFERENCES public.questions (id) ON DELETE CASCADE,
  clusters_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary_text  TEXT,
  last_updated  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_question_insights_question_id ON public.question_insights (question_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER questions_set_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER responses_set_updated_at
  BEFORE UPDATE ON public.responses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER friendships_set_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_insights ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users_select_all"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- questions
CREATE POLICY "questions_select_all"
  ON public.questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "questions_insert_authenticated"
  ON public.questions FOR INSERT
  TO authenticated
  WITH CHECK (created_by IS NULL OR created_by = auth.uid());

CREATE POLICY "questions_update_own"
  ON public.questions FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- responses
CREATE POLICY "responses_select_authenticated"
  ON public.responses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "responses_insert_own"
  ON public.responses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "responses_update_own"
  ON public.responses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "responses_delete_own"
  ON public.responses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- friendships
CREATE POLICY "friendships_select_participant"
  ON public.friendships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "friendships_insert_requester"
  ON public.friendships FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "friendships_update_participant"
  ON public.friendships FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "friendships_delete_participant"
  ON public.friendships FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- question_insights (read-only for clients; writes via service role / edge fn later)
CREATE POLICY "question_insights_select_authenticated"
  ON public.question_insights FOR SELECT
  TO authenticated
  USING (true);
