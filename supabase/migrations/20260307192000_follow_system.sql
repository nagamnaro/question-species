-- Simple follow model: user_id follows friend_id with instant acceptance (MVP Phase 2).

ALTER TABLE public.friendships
  ALTER COLUMN status SET DEFAULT 'accepted';

-- Authenticated users can read the follow graph (follower counts, friend highlights).
CREATE POLICY "friendships_select_authenticated"
  ON public.friendships FOR SELECT
  TO authenticated
  USING (true);

-- Restrict delete on follow rows to the follower only (unfollow).
DROP POLICY IF EXISTS "friendships_delete_participant" ON public.friendships;

CREATE POLICY "friendships_delete_own_follow"
  ON public.friendships FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Public profile stats (questions answered count).
CREATE OR REPLACE FUNCTION public.get_user_response_count(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM public.responses WHERE user_id = p_user_id;
$$;

REVOKE ALL ON FUNCTION public.get_user_response_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_response_count(uuid) TO authenticated, anon;

-- Allow browsing profiles without signing in.
CREATE POLICY "users_select_anon"
  ON public.users FOR SELECT
  TO anon
  USING (true);
