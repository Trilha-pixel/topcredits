-- Fix RLS policies to ensure users only see their own data
-- Execute este script no Supabase SQL Editor

-- ============================================================================
-- 1. ORDERS - Usuários só veem seus próprios pedidos
-- ============================================================================

-- Remove políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;

-- Cria políticas corretas
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. LICENSES - Usuários só veem suas próprias licenças
-- ============================================================================

-- Verifica se a tabela licenses existe
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'licenses') THEN
    
    -- Remove políticas antigas
    DROP POLICY IF EXISTS "Users can view own licenses" ON public.licenses;
    DROP POLICY IF EXISTS "Users can insert own licenses" ON public.licenses;
    DROP POLICY IF EXISTS "Users can update own licenses" ON public.licenses;
    
    -- Cria políticas corretas
    CREATE POLICY "Users can view own licenses" ON public.licenses
      FOR SELECT 
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own licenses" ON public.licenses
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own licenses" ON public.licenses
      FOR UPDATE 
      USING (auth.uid() = user_id);
      
  END IF;
END $$;

-- ============================================================================
-- 3. TRANSACTIONS - Usuários só veem suas próprias transações
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 4. WALLETS - Usuários só veem sua própria carteira
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;

CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.wallets
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. PROFILES - Usuários só veem seu próprio perfil
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = id);

-- ============================================================================
-- 6. PRODUCTS - Todos podem ver (público)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view products" ON public.products;

CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT 
  USING (true);

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Verifica as políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Teste rápido (substitua o user_id pelo seu)
-- SELECT * FROM orders WHERE user_id = auth.uid();
-- SELECT * FROM transactions WHERE user_id = auth.uid();
-- SELECT * FROM wallets WHERE user_id = auth.uid();
