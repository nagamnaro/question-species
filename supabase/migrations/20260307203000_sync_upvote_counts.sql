-- Seed data included decorative upvote counts; sync to real user upvotes only.

UPDATE public.questions SET upvotes = 0;

UPDATE public.questions q
SET upvotes = counts.cnt
FROM (
  SELECT question_id, COUNT(*)::integer AS cnt
  FROM public.question_upvotes
  GROUP BY question_id
) AS counts
WHERE q.id = counts.question_id;
