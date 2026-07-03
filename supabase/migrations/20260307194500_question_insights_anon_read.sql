-- Allow anonymous feed to read insight cluster summaries for anti-echo badges.

CREATE POLICY "question_insights_select_anon"
  ON public.question_insights FOR SELECT
  TO anon
  USING (true);
