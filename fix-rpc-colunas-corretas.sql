-- ===============================================================================
-- CORRIGIR FUNÇÕES RPC - USAR APENAS COLUNAS QUE EXISTEM
-- ===============================================================================

-- ===============================================================================
-- 0. DROPAR FUNÇÕES ANTIGAS
-- ===============================================================================

DROP FUNCTION IF EXISTS public.get_all_orders_admin(TEXT, TEXT, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.get_all_customers_admin(TEXT) CASCADE;

-- ===============================================================================
-- 1. RECRIAR get_all_orders_admin() SEM customer_name
-- ===============================================================================

CREATE OR REPLACE FUNCTION public.get_all_orders_admin(
  p_status TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 1000,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  product_id INTEGER,
  credits_amount INTEGER,
  price_at_purchase NUMERIC,
  status TEXT,
  lovable_email TEXT,
  delivery_link TEXT,
  delivery_code TEXT,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  user_name TEXT,
  customer_email TEXT,
  product_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    o.id,
    o.user_id,
    o.product_id,
    o.credits_amount,
    o.price_at_purchase,
    o.status,
    o.lovable_email,
    o.delivery_link,
    o.delivery_code,
    o.created_at,
    o.completed_at,
    COALESCE(p.full_name, 'Cliente') as user_name,
    p.email as customer_email,
    pr.name as product_name
  FROM orders o
  LEFT JOIN profiles p ON o.user_id = p.id
  LEFT JOIN products pr ON o.product_id = pr.id
  WHERE 
    (p_status IS NULL OR o.status = p_status)
    AND (
      p_search IS NULL 
      OR p.full_name ILIKE '%' || p_search || '%'
      OR p.email ILIKE '%' || p_search || '%'
      OR o.lovable_email ILIKE '%' || p_search || '%'
    )
  ORDER BY o.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- ===============================================================================
-- 2. RECRIAR get_all_customers_admin() SEM phone
-- ===============================================================================

CREATE OR REPLACE FUNCTION public.get_all_customers_admin(
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  balance NUMERIC,
  total_orders INTEGER,
  total_spent NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.is_active,
    p.created_at,
    COALESCE(w.balance, 0) as balance,
    (SELECT COUNT(*)::INTEGER FROM orders WHERE user_id = p.id) as total_orders,
    (SELECT COALESCE(SUM(price_at_purchase), 0) FROM orders WHERE user_id = p.id AND status = 'completed') as total_spent
  FROM profiles p
  LEFT JOIN wallets w ON p.id = w.user_id
  WHERE 
    p.role = 'customer'
    AND (
      p_search IS NULL 
      OR p.full_name ILIKE '%' || p_search || '%'
      OR p.email ILIKE '%' || p_search || '%'
    )
  ORDER BY p.created_at DESC;
$$;

-- ===============================================================================
-- 3. CONCEDER PERMISSÕES
-- ===============================================================================

GRANT EXECUTE ON FUNCTION public.get_all_orders_admin(TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_customers_admin(TEXT) TO anon, authenticated;

-- ===============================================================================
-- 4. TESTAR AS FUNÇÕES
-- ===============================================================================

-- Teste orders
SELECT 'TESTE ORDERS' as teste;
SELECT id, user_name, lovable_email, status, price_at_purchase, product_name 
FROM public.get_all_orders_admin(NULL, NULL, 10, 0);

-- Teste customers
SELECT 'TESTE CUSTOMERS' as teste;
SELECT id, full_name, email, balance, total_orders 
FROM public.get_all_customers_admin(NULL);

-- ===============================================================================
-- RESULTADO ESPERADO
-- ===============================================================================
-- 
-- TESTE ORDERS: Deve retornar 9 pedidos
-- TESTE CUSTOMERS: Deve retornar 1 cliente
-- 
-- Se funcionar, recarregue o painel admin!
-- 
-- ===============================================================================
