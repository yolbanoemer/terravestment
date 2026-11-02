-- Per-member withdrawal fee, set by admins, applied when a payout is approved
ALTER TABLE public.profiles
  ADD COLUMN withdrawal_fee_pct numeric NOT NULL DEFAULT 0;
COMMENT ON COLUMN public.profiles.withdrawal_fee_pct IS 'Per-member withdrawal fee in percent, applied by resolve_withdrawal at approval';

-- Fee actually deducted on a given payout
ALTER TABLE public.withdrawals
  ADD COLUMN fee_amount numeric NOT NULL DEFAULT 0;
COMMENT ON COLUMN public.withdrawals.fee_amount IS 'Fee in USD deducted from this payout when approved';

-- Withdrawal requests: members must have funded (confirmed deposit) or invested first
CREATE OR REPLACE FUNCTION public.request_withdrawal(_amount numeric, _method text, _destination text, _lang text DEFAULT 'en')
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid UUID := auth.uid();
  bal NUMERIC;
  min_w NUMERIC;
  wid UUID;
  has_history BOOLEAN;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;

  SELECT EXISTS (
           SELECT 1 FROM public.deposits WHERE user_id = uid AND status = 'confirmed'
         )
      OR EXISTS (
           SELECT 1 FROM public.investments WHERE user_id = uid
         )
    INTO has_history;

  IF NOT has_history THEN
    IF _lang = 'de' THEN
      RAISE EXCEPTION 'Bitte investieren Sie zuerst, bevor Sie eine Auszahlung anfordern.';
    ELSE
      RAISE EXCEPTION 'Please invest first before you withdraw.';
    END IF;
  END IF;

  SELECT coalesce((value->>'min_withdrawal')::numeric,0) INTO min_w
    FROM public.platform_settings WHERE key='platform';
  IF _amount < coalesce(min_w,0) THEN
    RAISE EXCEPTION 'Minimum withdrawal is %', min_w;
  END IF;

  SELECT wallet_balance INTO bal FROM public.profiles WHERE id = uid FOR UPDATE;
  IF bal < _amount THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;

  UPDATE public.profiles SET wallet_balance = wallet_balance - _amount WHERE id = uid;
  INSERT INTO public.withdrawals (user_id, amount, method, destination)
    VALUES (uid,_amount,_method,_destination) RETURNING id INTO wid;
  INSERT INTO public.wallet_transactions (user_id, type, amount, status, note, reference)
    VALUES (uid,'withdrawal', -_amount, 'pending', _method || ' → ' || _destination, wid::text);
  RETURN wid;
END;
$function$;

-- Payout approval: deduct the member's withdrawal fee and record it
CREATE OR REPLACE FUNCTION public.resolve_withdrawal(_id uuid, _status withdrawal_status, _note text DEFAULT NULL)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  w RECORD;
  fee NUMERIC;
  fee_pct NUMERIC;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Not allowed'; END IF;

  SELECT * INTO w FROM public.withdrawals WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF w.status <> 'pending' THEN RAISE EXCEPTION 'Request already resolved'; END IF;

  UPDATE public.withdrawals SET status = _status, admin_note = _note WHERE id = _id;

  IF _status = 'rejected' THEN
    UPDATE public.profiles SET wallet_balance = wallet_balance + w.amount WHERE id = w.user_id;
    UPDATE public.wallet_transactions SET status='failed', note = coalesce(note,'') || ' · refunded'
      WHERE reference = _id::text AND type='withdrawal';
  ELSIF _status IN ('approved','paid') THEN
    SELECT withdrawal_fee_pct INTO fee_pct FROM public.profiles WHERE id = w.user_id;
    fee := round(w.amount * coalesce(fee_pct,0) / 100.0, 2);
    IF fee > 0 THEN
      UPDATE public.withdrawals SET fee_amount = fee WHERE id = _id;
      INSERT INTO public.wallet_transactions (user_id, type, amount, status, note)
        VALUES (w.user_id, 'fee', -fee, 'completed', 'Withdrawal fee (' || fee_pct::text || '%)');
    END IF;
    UPDATE public.wallet_transactions SET status='completed'
      WHERE reference = _id::text AND type='withdrawal';
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_withdrawal(uuid, withdrawal_status, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.resolve_withdrawal(uuid, withdrawal_status, text) FROM PUBLIC, anon;