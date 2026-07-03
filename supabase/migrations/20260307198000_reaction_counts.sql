-- Aggregate reaction counts for response social proof.

CREATE OR REPLACE FUNCTION public.get_response_reaction_counts(
  p_response_ids uuid[]
)
RETURNS TABLE(
  response_id uuid,
  agree_count bigint,
  disagree_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id AS response_id,
    COUNT(*) FILTER (WHERE rr.reaction = 'agree') AS agree_count,
    COUNT(*) FILTER (WHERE rr.reaction = 'disagree') AS disagree_count
  FROM unnest(p_response_ids) AS r(id)
  LEFT JOIN public.response_reactions rr ON rr.response_id = r.id
  GROUP BY r.id;
$$;

REVOKE ALL ON FUNCTION public.get_response_reaction_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_response_reaction_counts(uuid[]) TO authenticated;
