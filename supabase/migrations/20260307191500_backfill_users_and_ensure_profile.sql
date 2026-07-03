-- Users who signed up before handle_new_user existed have auth.users rows
-- but no public.users profile, causing FK failures on response insert.

INSERT INTO public.users (id, email, display_name)
SELECT
  id,
  email,
  COALESCE(
    raw_user_meta_data ->> 'display_name',
    split_part(email, '@', 1)
  )
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to create their own profile if still missing
CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Callable before inserts that reference public.users
CREATE OR REPLACE FUNCTION public.ensure_current_user_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  SELECT
    id,
    email,
    COALESCE(
      raw_user_meta_data ->> 'display_name',
      split_part(email, '@', 1)
    )
  FROM auth.users
  WHERE id = auth.uid()
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_current_user_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_current_user_profile() TO authenticated;
