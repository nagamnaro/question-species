-- Social engagement: upvotes, reactions, replies + puzzle canonical answers.

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS canonical_answer TEXT;

-- ---------------------------------------------------------------------------
-- Question upvotes (one per user per question)
-- ---------------------------------------------------------------------------

CREATE TABLE public.question_upvotes (
  user_id     UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions (id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX idx_question_upvotes_question_id ON public.question_upvotes (question_id);

CREATE OR REPLACE FUNCTION public.sync_question_upvote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.questions
    SET upvotes = upvotes + 1
    WHERE id = NEW.question_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.questions
    SET upvotes = GREATEST(upvotes - 1, 0)
    WHERE id = OLD.question_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER question_upvotes_sync_count
  AFTER INSERT OR DELETE ON public.question_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.sync_question_upvote_count();

CREATE OR REPLACE FUNCTION public.toggle_question_upvote(p_question_id uuid)
RETURNS TABLE(upvoted boolean, upvotes integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_exists boolean;
  v_count integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.question_upvotes
    WHERE user_id = v_uid AND question_id = p_question_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.question_upvotes
    WHERE user_id = v_uid AND question_id = p_question_id;
    upvoted := false;
  ELSE
    INSERT INTO public.question_upvotes (user_id, question_id)
    VALUES (v_uid, p_question_id);
    upvoted := true;
  END IF;

  SELECT q.upvotes INTO v_count
  FROM public.questions q
  WHERE q.id = p_question_id;

  upvotes := COALESCE(v_count, 0);
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_question_upvote(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_question_upvote(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Response reactions (agree / disagree with someone's answer)
-- ---------------------------------------------------------------------------

CREATE TABLE public.response_reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  response_id UUID NOT NULL REFERENCES public.responses (id) ON DELETE CASCADE,
  reaction    TEXT NOT NULL CHECK (reaction IN ('agree', 'disagree')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT response_reactions_user_response_unique UNIQUE (user_id, response_id)
);

CREATE INDEX idx_response_reactions_response_id ON public.response_reactions (response_id);

CREATE TRIGGER response_reactions_set_updated_at
  BEFORE UPDATE ON public.response_reactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Response replies
-- ---------------------------------------------------------------------------

CREATE TABLE public.response_replies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.responses (id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  text        TEXT NOT NULL CHECK (char_length(trim(text)) > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_response_replies_response_id ON public.response_replies (response_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.question_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "question_upvotes_select_authenticated"
  ON public.question_upvotes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "question_upvotes_insert_own"
  ON public.question_upvotes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "question_upvotes_delete_own"
  ON public.question_upvotes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "response_reactions_select_authenticated"
  ON public.response_reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "response_reactions_insert_own"
  ON public.response_reactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "response_reactions_update_own"
  ON public.response_reactions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "response_reactions_delete_own"
  ON public.response_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "response_replies_select_authenticated"
  ON public.response_replies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "response_replies_insert_own"
  ON public.response_replies FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Canonical answers for verifiable puzzles (MVP subset)
-- ---------------------------------------------------------------------------

UPDATE public.questions
SET canonical_answer = '0.05'
WHERE text LIKE '%bat and a ball cost%';

UPDATE public.questions
SET canonical_answer = 'yes'
WHERE text LIKE '%12 coins, one is counterfeit%';
