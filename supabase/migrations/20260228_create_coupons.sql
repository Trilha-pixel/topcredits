-- ============================================
-- TABELA DE CUPONS DE DESCONTO
-- ============================================

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  max_uses INT DEFAULT NULL,            -- NULL = usos infinitos
  current_uses INT DEFAULT 0 NOT NULL,
  min_purchase_value NUMERIC DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT NULL,   -- NULL = nunca expira
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- SELECT para todos (autenticados ou não) - para o checkout validar
CREATE POLICY "coupons_select_active"
  ON public.coupons
  FOR SELECT
  USING (is_active = true);

-- ALL para admins - CRUD completo
CREATE POLICY "coupons_admin_all"
  ON public.coupons
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- FUNÇÃO: Validar cupom no checkout
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_code TEXT,
  p_purchase_value NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon RECORD;
  v_discount NUMERIC;
  v_final_value NUMERIC;
BEGIN
  -- Busca o cupom
  SELECT * INTO v_coupon
    FROM public.coupons
    WHERE code = UPPER(TRIM(p_code))
      AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Cupom não encontrado ou inativo.');
  END IF;

  -- Verifica expiração
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
    RETURN json_build_object('valid', false, 'error', 'Este cupom está expirado.');
  END IF;

  -- Verifica limite de usos
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
    RETURN json_build_object('valid', false, 'error', 'Este cupom atingiu o limite de usos.');
  END IF;

  -- Verifica valor mínimo de compra
  IF p_purchase_value < v_coupon.min_purchase_value THEN
    RETURN json_build_object(
      'valid', false,
      'error', format('Valor mínimo de compra: R$ %s', v_coupon.min_purchase_value::TEXT)
    );
  END IF;

  -- Calcula desconto
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := ROUND(p_purchase_value * (v_coupon.discount_value / 100), 2);
  ELSE
    v_discount := LEAST(v_coupon.discount_value, p_purchase_value);
  END IF;

  v_final_value := GREATEST(p_purchase_value - v_discount, 0);

  RETURN json_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'discount_amount', v_discount,
    'final_value', v_final_value,
    'original_value', p_purchase_value
  );
END;
$$;

-- ============================================
-- FUNÇÃO: Aplicar cupom (incrementa current_uses)
-- ============================================

CREATE OR REPLACE FUNCTION public.apply_coupon(p_coupon_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.coupons
     SET current_uses = current_uses + 1
   WHERE id = p_coupon_id
     AND is_active = true
     AND (max_uses IS NULL OR current_uses < max_uses);
END;
$$;

-- ============================================
-- FUNÇÃO: KPIs de cupons para o Admin
-- ============================================

CREATE OR REPLACE FUNCTION public.get_coupon_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_coupons INT;
  v_total_uses INT;
  v_active_coupons INT;
BEGIN
  SELECT
    COUNT(*),
    COALESCE(SUM(current_uses), 0),
    COUNT(*) FILTER (WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW()))
  INTO v_total_coupons, v_total_uses, v_active_coupons
  FROM public.coupons;

  RETURN json_build_object(
    'total_coupons', v_total_coupons,
    'total_uses', v_total_uses,
    'active_coupons', v_active_coupons
  );
END;
$$;
