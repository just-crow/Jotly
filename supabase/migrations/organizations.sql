-- ============================================
-- Organizations Migration
-- ============================================

-- Helper: extract email domain for the currently authenticated user
CREATE OR REPLACE FUNCTION public.get_auth_user_email_domain()
RETURNS TEXT AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  RETURN LOWER(SPLIT_PART(v_email, '@', 2));
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Organizations table (one row per email domain)
CREATE TABLE IF NOT EXISTS public.organizations (
  domain            TEXT PRIMARY KEY,      -- e.g. "mit.edu"
  display_name      TEXT NOT NULL,         -- e.g. "MIT"
  discount_percent  INTEGER NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  created_by        UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Anyone can read organizations (so purchase wall can show discount)
CREATE POLICY "Organizations are publicly readable"
  ON public.organizations FOR SELECT
  USING (true);

-- A user may create their org row only when the domain in the row matches their email domain
CREATE POLICY "Org members can create their org"
  ON public.organizations FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND domain = public.get_auth_user_email_domain()
  );

-- A user may update their org's row only when their email domain matches
CREATE POLICY "Org members can update their org"
  ON public.organizations FOR UPDATE
  USING (domain = public.get_auth_user_email_domain())
  WITH CHECK (domain = public.get_auth_user_email_domain());

-- Auto-update updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
