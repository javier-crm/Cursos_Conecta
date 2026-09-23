-- Funciones de apoyo para pagos

create or replace function public.increment_coupon_redemption(p_coupon_id uuid)
returns void language sql security definer set search_path = public as $$
  update coupons set redeemed_count = redeemed_count + 1 where id = p_coupon_id;
$$;
