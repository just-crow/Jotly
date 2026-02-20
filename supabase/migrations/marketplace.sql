-- =================================================================
-- MARKETPLACE MIGRATION
-- Run this entire file in the Supabase SQL Editor (one paste, one Run)
-- Safe to re-run — all statements use IF NOT EXISTS / OR REPLACE
-- =================================================================

-- 1. Add columns to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS points_balance INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS dollar_balance NUMERIC(10,2) NOT NULL DEFAULT 0;

-- 2. Add columns to notes
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS is_sold BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Add price constraint (safe if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notes_price_range'
  ) THEN
    ALTER TABLE public.notes ADD CONSTRAINT notes_price_range CHECK (price >= 0 AND price <= 999.99);
  END IF;
END $$;

-- 4. Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('points_purchase','note_bought_points','note_bought_dollars','note_sale')),
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  points_amount INTEGER NOT NULL DEFAULT 0,
  note_id UUID REFERENCES public.notes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own transactions' AND tablename = 'transactions') THEN
    CREATE POLICY "Users can read own transactions"
      ON public.transactions FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own transactions' AND tablename = 'transactions') THEN
    CREATE POLICY "Users can insert own transactions"
      ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 5. Purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  price_paid NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('points','dollars')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(buyer_id, note_id)
);

CREATE INDEX IF NOT EXISTS purchases_buyer_id_idx ON public.purchases(buyer_id);
CREATE INDEX IF NOT EXISTS purchases_note_id_idx ON public.purchases(note_id);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own purchases' AND tablename = 'purchases') THEN
    CREATE POLICY "Users can read own purchases"
      ON public.purchases FOR SELECT USING (auth.uid() = buyer_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Publishers can read sales of own notes' AND tablename = 'purchases') THEN
    CREATE POLICY "Publishers can read sales of own notes"
      ON public.purchases FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.notes WHERE id = note_id AND user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own purchases' AND tablename = 'purchases') THEN
    CREATE POLICY "Users can insert own purchases"
      ON public.purchases FOR INSERT WITH CHECK (auth.uid() = buyer_id);
  END IF;
END $$;

-- 6. buy_points() RPC — atomic points purchase
CREATE OR REPLACE FUNCTION public.buy_points(
  p_user_id UUID,
  p_amount NUMERIC,
  p_points INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Security: ensure caller can only act on their own behalf
  IF p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: user ID mismatch';
  END IF;

  -- Validate that points match the expected conversion rate
  IF p_points <> (p_amount * 100)::INTEGER THEN
    RAISE EXCEPTION 'Invalid points/amount ratio';
  END IF;

  UPDATE public.users
    SET points_balance = points_balance + p_points
    WHERE id = p_user_id
    RETURNING points_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO public.transactions (user_id, type, amount, points_amount)
  VALUES (p_user_id, 'points_purchase', p_amount, p_points);

  RETURN json_build_object(
    'new_balance', v_new_balance,
    'points_credited', p_points
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. purchase_note() RPC — atomic note purchase with exclusive rights support
CREATE OR REPLACE FUNCTION public.purchase_note(
  p_buyer_id UUID,
  p_note_id UUID,
  p_payment_method TEXT,
  p_dollar_price NUMERIC,
  p_amount_charged NUMERIC,
  p_points_cost INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_buyer_balance INTEGER;
  v_publisher_id UUID;
  v_is_exclusive BOOLEAN;
  v_is_sold BOOLEAN;
  v_tx_type TEXT;
  
  -- NEW VARIABLES FOR FEE
  v_platform_fee NUMERIC;
  v_publisher_earnings NUMERIC;
BEGIN
  -- Security: ensure caller can only act on their own behalf
  IF p_buyer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: user ID mismatch';
  END IF;

  SELECT user_id, is_exclusive, is_sold
    INTO v_publisher_id, v_is_exclusive, v_is_sold
    FROM public.notes WHERE id = p_note_id;

  IF v_publisher_id IS NULL THEN
    RAISE EXCEPTION 'Note not found';
  END IF;

  IF EXISTS (SELECT 1 FROM public.purchases WHERE buyer_id = p_buyer_id AND note_id = p_note_id) THEN
    RAISE EXCEPTION 'Already purchased';
  END IF;

  IF v_is_exclusive AND v_is_sold THEN
    RAISE EXCEPTION 'Exclusive note already sold';
  END IF;

  -- CALCULATE FEE (30% CUT)
  v_platform_fee := p_dollar_price * 0.30; -- 30% Fee
  v_publisher_earnings := p_dollar_price - v_platform_fee; -- 70% to Publisher

  IF p_payment_method = 'points' THEN
    UPDATE public.users
      SET points_balance = points_balance - p_points_cost
      WHERE id = p_buyer_id AND points_balance >= p_points_cost
      RETURNING points_balance INTO v_buyer_balance;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient points';
    END IF;

    v_tx_type := 'note_bought_points';
  ELSE
    v_buyer_balance := 0;
    v_tx_type := 'note_bought_dollars';
  END IF;

  -- CREDIT THE PUBLISHER (Earnings only, not full price)
  UPDATE public.users
    SET dollar_balance = dollar_balance + v_publisher_earnings
    WHERE id = v_publisher_id;

  -- Log the transaction for the buyer
  INSERT INTO public.transactions (user_id, type, amount, points_amount, note_id)
  VALUES (p_buyer_id, v_tx_type, p_amount_charged, p_points_cost, p_note_id);

  -- Log the transaction for the publisher (Show the amount they actually received)
  INSERT INTO public.transactions (user_id, type, amount, points_amount, note_id)
  VALUES (v_publisher_id, 'note_sale', v_publisher_earnings, 0, p_note_id);

  INSERT INTO public.purchases (buyer_id, note_id, price_paid, payment_method)
  VALUES (p_buyer_id, p_note_id, p_amount_charged, p_payment_method);

  IF v_is_exclusive THEN
    UPDATE public.notes SET is_sold = true WHERE id = p_note_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'buyer_points_balance', v_buyer_balance,
    'payment_method', p_payment_method,
    'amount_charged', p_amount_charged,
    'points_deducted', p_points_cost,
    'is_exclusive', v_is_exclusive,
    'publisher_earned', v_publisher_earnings
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.buy_points TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_note TO authenticated;
