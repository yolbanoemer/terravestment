CREATE OR REPLACE FUNCTION public.request_deposit(
  _method public.deposit_method,
  _amount numeric,
  _asset text,
  _country text,
  _destination text,
  _reference text,
  _lang text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  current_balance numeric := 0;
  has_confirmed_deposit boolean := false;
  min_deposit numeric;
  currency_code text;
  request_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Enter an amount greater than zero'; END IF;
  IF _method = 'bank' THEN RAISE EXCEPTION 'Bank deposits are not available at the moment'; END IF;

  SELECT COALESCE(wallet_balance, 0) INTO current_balance
  FROM public.profiles WHERE id = uid FOR UPDATE;
  SELECT EXISTS (
    SELECT 1 FROM public.deposits WHERE user_id = uid AND status = 'confirmed'
  ) INTO has_confirmed_deposit;

  IF NOT has_confirmed_deposit THEN
    currency_code := CASE WHEN lower(COALESCE(_lang, 'en')) = 'de' THEN 'EUR' ELSE 'USD' END;
    min_deposit := CASE WHEN current_balance > 10000 THEN 200 ELSE 100 END;
    IF _amount < min_deposit THEN
      IF currency_code = 'EUR' AND min_deposit = 200 THEN
        RAISE EXCEPTION 'Die erste Einzahlung muss mindestens % EUR betragen (Richtwert: 200–300 EUR).', min_deposit;
      ELSIF currency_code = 'EUR' THEN
        RAISE EXCEPTION 'Die erste Einzahlung muss mindestens % EUR betragen.', min_deposit;
      ELSIF min_deposit = 200 THEN
        RAISE EXCEPTION 'Your first deposit must be at least % USD (suggested range: 200–300 USD).', min_deposit;
      ELSE
        RAISE EXCEPTION 'Your first deposit must be at least % USD.', min_deposit;
      END IF;
    END IF;
  END IF;

  INSERT INTO public.deposits (user_id, method, amount, asset, country, destination, reference)
  VALUES (uid, _method, _amount, COALESCE(_asset, 'USD'), _country, _destination, _reference)
  RETURNING id INTO request_id;
  RETURN request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_deposit(
  _method public.deposit_method,
  _amount numeric,
  _asset text DEFAULT 'USD',
  _country text DEFAULT NULL,
  _destination text DEFAULT NULL,
  _reference text DEFAULT NULL
) RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.request_deposit(_method, _amount, _asset, _country, _destination, _reference, 'en');
$$;

REVOKE ALL ON FUNCTION public.request_deposit(public.deposit_method, numeric, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_deposit(public.deposit_method, numeric, text, text, text, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.request_deposit(public.deposit_method, numeric, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_deposit(public.deposit_method, numeric, text, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.request_withdrawal(
  _amount numeric,
  _method text,
  _destination text,
  _lang text DEFAULT 'en'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  balance numeric;
  min_withdrawal numeric;
  withdrawal_id uuid;
  has_confirmed_deposit boolean;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.deposits WHERE user_id = uid AND status = 'confirmed'
  ) INTO has_confirmed_deposit;
  IF NOT has_confirmed_deposit THEN
    IF lower(COALESCE(_lang, 'en')) = 'de' THEN
      RAISE EXCEPTION 'Bitte zahlen Sie zuerst Geld ein, bevor Sie eine Auszahlung anfordern.';
    ELSE
      RAISE EXCEPTION 'Please deposit funds first before requesting a withdrawal.';
    END IF;
  END IF;

  SELECT COALESCE((value->>'min_withdrawal')::numeric, 0) INTO min_withdrawal
  FROM public.platform_settings WHERE key = 'platform';
  IF _amount < COALESCE(min_withdrawal, 0) THEN
    RAISE EXCEPTION 'Minimum withdrawal is %', min_withdrawal;
  END IF;

  SELECT wallet_balance INTO balance FROM public.profiles WHERE id = uid FOR UPDATE;
  IF balance < _amount THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;

  UPDATE public.profiles SET wallet_balance = wallet_balance - _amount WHERE id = uid;
  INSERT INTO public.withdrawals (user_id, amount, method, destination)
  VALUES (uid, _amount, _method, _destination) RETURNING id INTO withdrawal_id;
  INSERT INTO public.wallet_transactions (user_id, type, amount, status, note, reference)
  VALUES (uid, 'withdrawal', -_amount, 'pending', _method || ' → ' || _destination, withdrawal_id::text);
  RETURN withdrawal_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.request_withdrawal(
  _amount numeric,
  _method text,
  _destination text
) RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.request_withdrawal(_amount, _method, _destination, 'en');
$$;

REVOKE ALL ON FUNCTION public.request_withdrawal(numeric, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.request_withdrawal(numeric, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, text) TO authenticated;