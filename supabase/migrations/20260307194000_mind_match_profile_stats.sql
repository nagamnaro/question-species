-- Aggregate profile stats for thinking tags (no answer text exposed).

CREATE OR REPLACE FUNCTION public.get_user_thinking_stats(p_user_id uuid)
RETURNS TABLE(
  response_count bigint,
  reasoning_count bigint,
  species_counts jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(r.id)::bigint AS response_count,
    COUNT(r.id) FILTER (
      WHERE r.reasoning_text IS NOT NULL AND char_length(trim(r.reasoning_text)) > 0
    )::bigint AS reasoning_count,
    COALESCE(
      (
        SELECT jsonb_object_agg(species::text, cnt)
        FROM (
          SELECT q.species, COUNT(*)::bigint AS cnt
          FROM public.responses r2
          JOIN public.questions q ON q.id = r2.question_id
          WHERE r2.user_id = p_user_id
          GROUP BY q.species
        ) s
      ),
      '{}'::jsonb
    ) AS species_counts
  FROM public.responses r
  WHERE r.user_id = p_user_id;
$$;

REVOKE ALL ON FUNCTION public.get_user_thinking_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_thinking_stats(uuid) TO authenticated, anon;
