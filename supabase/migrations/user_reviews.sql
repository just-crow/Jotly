-- ============================================
-- User Reviews Migration
-- ============================================

-- 1. user_reviews table
CREATE TABLE IF NOT EXISTS public.user_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(reviewer_id, reviewed_user_id),
  CONSTRAINT no_self_review CHECK (reviewer_id != reviewed_user_id)
);

CREATE INDEX IF NOT EXISTS user_reviews_reviewed_user_id_idx ON public.user_reviews(reviewed_user_id);
CREATE INDEX IF NOT EXISTS user_reviews_reviewer_id_idx    ON public.user_reviews(reviewer_id);

ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Reviews are publicly readable"
  ON public.user_reviews FOR SELECT
  USING (true);

-- Authenticated users can create reviews (not themselves)
CREATE POLICY "Authenticated users can create reviews"
  ON public.user_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id AND auth.uid() != reviewed_user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON public.user_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON public.user_reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- Auto-update updated_at
CREATE TRIGGER update_user_reviews_updated_at
  BEFORE UPDATE ON public.user_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 2. Avatars storage bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public reads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anyone can read avatars'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Anyone can read avatars"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'avatars')
    $policy$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload avatars'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Authenticated users can upload avatars"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated')
    $policy$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can update own avatars'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can update own avatars"
        ON storage.objects FOR UPDATE
        USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
    $policy$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can delete own avatars'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can delete own avatars"
        ON storage.objects FOR DELETE
        USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
    $policy$;
  END IF;
END $$;
