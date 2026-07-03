-- Profile personalization: short bio shown on user profiles.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE public.users
  ADD CONSTRAINT users_bio_length CHECK (
    bio IS NULL OR char_length(trim(bio)) <= 100
  );
