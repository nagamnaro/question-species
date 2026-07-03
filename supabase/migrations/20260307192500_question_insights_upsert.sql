-- Allow authenticated users who answered a question to cache AI insights.

CREATE OR REPLACE FUNCTION public.upsert_question_insight(
  p_question_id uuid,
  p_clusters_json jsonb,
  p_summary_text text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.responses
    WHERE question_id = p_question_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Must answer question before generating insights';
  END IF;

  INSERT INTO public.question_insights (
    question_id,
    clusters_json,
    summary_text,
    last_updated
  )
  VALUES (
    p_question_id,
    p_clusters_json,
    p_summary_text,
    now()
  )
  ON CONFLICT (question_id) DO UPDATE
  SET
    clusters_json = EXCLUDED.clusters_json,
    summary_text = EXCLUDED.summary_text,
    last_updated = now();
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_question_insight(uuid, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_question_insight(uuid, jsonb, text) TO authenticated;
