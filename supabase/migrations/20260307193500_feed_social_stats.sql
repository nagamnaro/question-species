-- Public aggregate stats for feed cards (response counts, friend participation).

CREATE OR REPLACE FUNCTION public.get_feed_social_stats(
  p_question_ids uuid[],
  p_friend_ids uuid[] DEFAULT '{}'
)
RETURNS TABLE(
  question_id uuid,
  response_count bigint,
  friends_answered bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    qid AS question_id,
    (
      SELECT COUNT(*)::bigint
      FROM public.responses r
      WHERE r.question_id = qid
    ) AS response_count,
    (
      SELECT COUNT(DISTINCT r.user_id)::bigint
      FROM public.responses r
      WHERE r.question_id = qid
        AND cardinality(p_friend_ids) > 0
        AND r.user_id = ANY (p_friend_ids)
    ) AS friends_answered
  FROM unnest(p_question_ids) AS qid;
$$;

REVOKE ALL ON FUNCTION public.get_feed_social_stats(uuid[], uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_feed_social_stats(uuid[], uuid[]) TO authenticated, anon;
