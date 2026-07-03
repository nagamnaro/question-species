-- Upvotes on public replies (response_replies).

ALTER TABLE public.response_replies
  ADD COLUMN IF NOT EXISTS upvotes INTEGER NOT NULL DEFAULT 0 CHECK (upvotes >= 0);

CREATE TABLE public.response_reply_upvotes (
  user_id    UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  reply_id   UUID NOT NULL REFERENCES public.response_replies (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, reply_id)
);

CREATE INDEX idx_response_reply_upvotes_reply_id
  ON public.response_reply_upvotes (reply_id);

CREATE OR REPLACE FUNCTION public.sync_response_reply_upvote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.response_replies
    SET upvotes = upvotes + 1
    WHERE id = NEW.reply_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.response_replies
    SET upvotes = GREATEST(upvotes - 1, 0)
    WHERE id = OLD.reply_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER response_reply_upvotes_sync_count
  AFTER INSERT OR DELETE ON public.response_reply_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.sync_response_reply_upvote_count();

CREATE OR REPLACE FUNCTION public.toggle_response_reply_upvote(p_reply_id uuid)
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
    SELECT 1 FROM public.response_reply_upvotes
    WHERE user_id = v_uid AND reply_id = p_reply_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.response_reply_upvotes
    WHERE user_id = v_uid AND reply_id = p_reply_id;
    upvoted := false;
  ELSE
    INSERT INTO public.response_reply_upvotes (user_id, reply_id)
    VALUES (v_uid, p_reply_id);
    upvoted := true;
  END IF;

  SELECT r.upvotes INTO v_count
  FROM public.response_replies r
  WHERE r.id = p_reply_id;

  upvotes := COALESCE(v_count, 0);
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_response_reply_upvote(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_response_reply_upvote(uuid) TO authenticated;

ALTER TABLE public.response_reply_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "response_reply_upvotes_select_authenticated"
  ON public.response_reply_upvotes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "response_reply_upvotes_insert_own"
  ON public.response_reply_upvotes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "response_reply_upvotes_delete_own"
  ON public.response_reply_upvotes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
