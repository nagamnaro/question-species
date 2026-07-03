-- Question submission moderation status.

DO $$ BEGIN
  CREATE TYPE public.question_status AS ENUM ('pending', 'published', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS status public.question_status NOT NULL DEFAULT 'published';

-- Existing seeded questions are live.
UPDATE public.questions SET status = 'published' WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_questions_status ON public.questions (status);

-- Feed and public reads: only published questions (submissions may be pending).
DROP POLICY IF EXISTS "questions_select_all" ON public.questions;

CREATE POLICY "questions_select_published"
  ON public.questions FOR SELECT
  TO authenticated
  USING (status = 'published');

CREATE POLICY "questions_select_own_pending"
  ON public.questions FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());
