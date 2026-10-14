CREATE TABLE public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL DEFAULT '',
  reason text NOT NULL DEFAULT '',
  cover_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recommendations_title_length CHECK (char_length(btrim(title)) BETWEEN 2 AND 160),
  CONSTRAINT recommendations_author_length CHECK (char_length(author) <= 120),
  CONSTRAINT recommendations_reason_length CHECK (char_length(reason) <= 500),
  CONSTRAINT recommendations_cover_url_length CHECK (cover_url IS NULL OR char_length(cover_url) <= 600)
);
GRANT SELECT, INSERT ON public.recommendations TO anon, authenticated;
GRANT ALL ON public.recommendations TO service_role;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read recommendations" ON public.recommendations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can submit recommendations" ON public.recommendations FOR INSERT TO anon, authenticated WITH CHECK (
  char_length(btrim(title)) BETWEEN 2 AND 160
  AND char_length(author) <= 120
  AND char_length(reason) <= 500
  AND (cover_url IS NULL OR char_length(cover_url) <= 600)
);

CREATE TABLE public.reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  pages_read integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'reading',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reading_progress_pages_nonnegative CHECK (pages_read >= 0),
  CONSTRAINT reading_progress_status_valid CHECK (status IN ('reading', 'finished')),
  CONSTRAINT reading_progress_user_book_unique UNIQUE (user_id, book_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_progress TO authenticated;
GRANT ALL ON public.reading_progress TO service_role;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own reading progress" ON public.reading_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.validate_reading_progress_pages()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  total_pages integer;
BEGIN
  SELECT pages INTO total_pages FROM public.books WHERE id = NEW.book_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Book not found';
  END IF;
  IF NEW.pages_read < 0 OR (total_pages IS NOT NULL AND NEW.pages_read > total_pages) THEN
    RAISE EXCEPTION 'Pages read must be between 0 and the total number of pages';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_reading_progress_pages_before_write
BEFORE INSERT OR UPDATE OF book_id, pages_read ON public.reading_progress
FOR EACH ROW EXECUTE FUNCTION public.validate_reading_progress_pages();