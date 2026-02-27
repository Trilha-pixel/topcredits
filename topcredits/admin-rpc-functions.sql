-- ===============================================================================
-- FUNÇÕES RPC PARA PAINEL ADMIN
-- ===============================================================================
-- Execute este script no Supabase SQL Editor para criar funções admin

-- 1. Função para obter estatísticas gerais do admin
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_orders', (SELECT COUNT(*) FROM orders),
    'pending_orders', (SELECT COUNT(*) FROM orders WHERE status = 'pending'),
    'completed_orders', (SELECT COUNT(*) FROM orders WHERE status = 'completed'),
    'cancelled_orders', (SELECT COUNT(*) FROM orders WHERE status = 'cancelled'),
    'total_customers', (SELECT COUNT(*) FROM profiles WHERE role = 'customer'),
    'total_revenue', (SELECT COALESCE(SUM(price_at_purchase), 0) FROM orders WHERE status = 'completed'),
    'total_credits_sold', (SELECT COALESCE(SUM(credits_amount), 0) FROM orders WHERE status = 'completed')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Função para obter todos os pedidos com informações do cliente e produto
CREATE OR REPLACE FUNCTION public.get_all_orders_admin(
  p_status TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
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
  customer_name TEXT,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  customer_full_name TEXT,
  customer_email TEXT,
  product_name TEXT
) AS $$
BEGIN
  RETURN QUERY
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
    o.customer_name,
    o.created_at,
    o.completed_at,
    p.full_name as customer_full_name,
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
      OR o.customer_name ILIKE '%' || p_search || '%'
    )
  ORDER BY o.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Função para obter todos os clientes com saldo
CREATE OR REPLACE FUNCTION public.get_all_customers_admin(
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  balance NUMERIC,
  total_orders INTEGER,
  total_spent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.phone,
    p.role,
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
      OR p.phone ILIKE '%' || p_search || '%'
    )
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função para atualizar saldo de um cliente (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_customer_balance(
  p_user_id UUID,
  p_new_balance NUMERIC,
  p_reason TEXT DEFAULT 'Ajuste manual pelo admin'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_old_balance NUMERIC;
  v_difference NUMERIC;
BEGIN
  -- Verificar se o usuário que chama é admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem atualizar saldos';
  END IF;

  -- Obter saldo atual
  SELECT balance INTO v_old_balance
  FROM wallets
  WHERE user_id = p_user_id;

  IF v_old_balance IS NULL THEN
    RAISE EXCEPTION 'Carteira não encontrada para o usuário';
  END IF;

  -- Calcular diferença
  v_difference := p_new_balance - v_old_balance;

  -- Atualizar saldo
  UPDATE wallets
  SET balance = p_new_balance
  WHERE user_id = p_user_id;

  -- Registrar transação
  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (
    p_user_id,
    CASE WHEN v_difference > 0 THEN 'deposit' ELSE 'adjustment' END,
    v_difference,
    p_reason
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Função para deletar um cliente (admin only)
CREATE OR REPLACE FUNCTION public.admin_delete_customer(
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se o usuário que chama é admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem deletar clientes';
  END IF;

  -- Deletar em cascata (orders, transactions, wallet serão deletados pelos triggers)
  DELETE FROM profiles WHERE id = p_user_id;
  
  -- Deletar do auth
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função para atualizar status de pedido
CREATE OR REPLACE FUNCTION public.admin_update_order_status(
  p_order_id UUID,
  p_new_status TEXT,
  p_delivery_link TEXT DEFAULT NULL,
  p_delivery_code TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se o usuário que chama é admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem atualizar pedidos';
  END IF;

  UPDATE orders
  SET 
    status = p_new_status,
    delivery_link = COALESCE(p_delivery_link, delivery_link),
    delivery_code = COALESCE(p_delivery_code, delivery_code),
    completed_at = CASE WHEN p_new_status = 'completed' THEN NOW() ELSE completed_at END
  WHERE id = p_order_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Conceder permissões
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_orders_admin(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_customers_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_customer_balance(UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_customer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_order_status(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- 8. Verificar se foi criado corretamente
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%admin%'
ORDER BY routine_name;

-- ===============================================================================
-- INSTRUÇÕES
-- ===============================================================================
-- 
-- 1. Execute este script no Supabase SQL Editor
-- 2. Verifique se todas as funções foram criadas
-- 3. Teste as funções no SQL Editor:
--
--    -- Obter estatísticas
--    SELECT * FROM get_admin_stats();
--
--    -- Obter todos os pedidos
--    SELECT * FROM get_all_orders_admin();
--
--    -- Obter todos os clientes
--    SELECT * FROM get_all_customers_admin();
--
-- ===============================================================================
