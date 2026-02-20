-- AI detection fields persisted when note is published
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS ai_detection_label TEXT;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS ai_detection_score NUMERIC;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS ai_detection_is_likely_ai BOOLEAN;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS ai_detection_summary TEXT;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS ai_detection_checked_at TIMESTAMPTZ;
