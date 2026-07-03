-- Private notes on responses: visible only to sender and recipient.

CREATE TABLE public.response_private_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id  UUID NOT NULL REFERENCES public.responses (id) ON DELETE CASCADE,
  question_id  UUID NOT NULL REFERENCES public.questions (id) ON DELETE CASCADE,
  sender_id    UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  body         TEXT NOT NULL CHECK (char_length(trim(body)) > 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at      TIMESTAMPTZ,
  CONSTRAINT response_private_messages_no_self CHECK (sender_id <> recipient_id)
);

CREATE INDEX idx_rpm_recipient_id ON public.response_private_messages (recipient_id, created_at DESC);
CREATE INDEX idx_rpm_sender_id ON public.response_private_messages (sender_id, created_at DESC);
CREATE INDEX idx_rpm_response_id ON public.response_private_messages (response_id);

ALTER TABLE public.response_private_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rpm_select_participant"
  ON public.response_private_messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "rpm_insert_sender"
  ON public.response_private_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.user_has_answered_question(question_id)
    AND (
      recipient_id = (
        SELECT user_id FROM public.responses WHERE id = response_id
      )
      OR (
        sender_id = (
          SELECT user_id FROM public.responses WHERE id = response_id
        )
        AND recipient_id IN (
          SELECT rpm.sender_id
          FROM public.response_private_messages rpm
          WHERE rpm.response_id = response_private_messages.response_id
            AND rpm.recipient_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "rpm_update_recipient_read"
  ON public.response_private_messages FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- First shared question between two users (for mind-match discussion links).

CREATE OR REPLACE FUNCTION public.get_shared_question_link(
  p_user_a uuid,
  p_user_b uuid
)
RETURNS TABLE(question_id uuid, response_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r_b.question_id, r_b.id AS response_id
  FROM public.responses r_a
  JOIN public.responses r_b
    ON r_b.question_id = r_a.question_id
   AND r_b.user_id = p_user_b
  WHERE r_a.user_id = p_user_a
  ORDER BY r_a.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_shared_question_link(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_question_link(uuid, uuid) TO authenticated;
