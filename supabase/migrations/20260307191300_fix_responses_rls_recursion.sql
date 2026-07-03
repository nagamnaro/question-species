-- Fix infinite recursion in responses SELECT policy.
-- RLS cannot subquery the same table; use a SECURITY DEFINER helper instead.

CREATE OR REPLACE FUNCTION public.user_has_answered_question(p_question_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.responses
    WHERE question_id = p_question_id
      AND user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.user_has_answered_question(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_answered_question(uuid) TO authenticated;

DROP POLICY IF EXISTS "responses_select_after_own_answer" ON public.responses;

CREATE POLICY "responses_select_after_own_answer"
  ON public.responses FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.user_has_answered_question(question_id)
  );
