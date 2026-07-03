-- Public read access for the home feed (browse without signing in)
CREATE POLICY "questions_select_anon"
  ON public.questions FOR SELECT
  TO anon
  USING (true);

-- Seed starter questions (system-authored, created_by NULL)
INSERT INTO public.questions (text, species, tags, upvotes, difficulty)
VALUES
  (
    'A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?',
    'puzzle',
    ARRAY['logic', 'math'],
    142,
    2
  ),
  (
    'Should cities ban cars from downtown areas to reduce emissions?',
    'opinion',
    ARRAY['ethics', 'urban'],
    89,
    NULL
  ),
  (
    'What percentage of households will have a humanoid robot by 2035?',
    'prediction',
    ARRAY['tech', 'future'],
    67,
    NULL
  ),
  (
    'How many piano tuners are there in London?',
    'estimation',
    ARRAY['fermi', 'geography'],
    54,
    3
  ),
  (
    'How would you redesign public transit to make it irresistible?',
    'brainstorm',
    ARRAY['ideas', 'urban'],
    31,
    NULL
  ),
  (
    'You have 12 coins, one is counterfeit and weighs differently. Using a balance scale only three times, can you find the fake?',
    'puzzle',
    ARRAY['logic', 'lateral'],
    118,
    4
  ),
  (
    'Is it ever ethical to lie to protect someone''s feelings?',
    'opinion',
    ARRAY['ethics', 'philosophy'],
    203,
    NULL
  ),
  (
    'How many trees are on Earth right now?',
    'estimation',
    ARRAY['fermi', 'nature'],
    76,
    NULL
  );
