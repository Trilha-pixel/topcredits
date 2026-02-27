-- ===============================================================================
-- HABILITAR RLS EM TODAS AS TABELAS SENSÍVEIS
-- ===============================================================================
-- Garantir que clientes não vejam dados financeiros e administrativos

-- ===============================================================================
-- 1. HABILITAR RLS NAS TABELAS
-- ===============================================================================

-- Tabelas financeiras (já devem ter RLS, mas garantir)
ALTER TABLE public.api_cost_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_cost_history ENABLE ROW LEVEL SECURITY;

-- Views (não podem ter RLS, mas vamos revogar acesso)
-- admin_financial_kpis
-- order_profit_analysis

-- ===============================================================================
-- 2. CRIAR POLÍTICAS PARA TABELAS SEM RLS
-- ===============================================================================

-- API_COST_LOGS - Apenas admins
DROP POLICY IF EXISTS "Only admins can access cost logs" ON public.api_cost_logs;

CREATE POLICY "Only admins can access cost logs"
ON public.api_cost_logs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- UNIT_COST_HISTORY - Apenas admins
DROP POLICY IF EXISTS "Only admins can access cost history" ON public.unit_cost_history;

CREATE POLICY "Only admins can access cost history"
ON public.unit_cost_history
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ===============================================================================
-- 3. REVOGAR ACESSO ÀS VIEWS FINANCEIRAS
-- ===============================================================================

-- Revogar acesso público às views
REVOKE ALL ON admin_financial_kpis FROM PUBLIC;
REVOKE ALL ON admin_financial_kpis FROM anon;

REVOKE ALL ON order_profit_analysis FROM PUBLIC;
REVOKE ALL ON order_profit_analysis FROM anon;

-- Manter acesso apenas para authenticated (RLS vai filtrar)
GRANT SELECT ON admin_financial_kpis TO authenticated;
GRANT SELECT ON order_profit_analysis TO authenticated;

-- ===============================================================================
-- 4. CRIAR FUNÇÃO HELPER PARA VERIFICAR SE É ADMIN
-- ===============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- ===============================================================================
-- 5. PROTEGER VIEWS COM POLÍTICAS (via função)
-- ===============================================================================

-- Criar view segura para admin_financial_kpis
CREATE OR REPLACE VIEW public.admin_financial_kpis_secure AS
SELECT * FROM admin_financial_kpis
WHERE public.is_admin() = true;

-- Criar view segura para order_profit_analysis
CREATE OR REPLACE VIEW public.order_profit_analysis_secure AS
SELECT * FROM order_profit_analysis
WHERE public.is_admin() = true;

-- Revogar acesso às views originais
REVOKE ALL ON admin_financial_kpis FROM authenticated;
REVOKE ALL ON order_profit_analysis FROM authenticated;

-- Conceder acesso apenas às views seguras
GRANT SELECT ON admin_financial_kpis_secure TO authenticated;
GRANT SELECT ON order_profit_analysis_secure TO authenticated;

-- ===============================================================================
-- 6. VERIFICAR STATUS DO RLS
-- ===============================================================================

SELECT 
  '=== STATUS DO RLS ===' as info;

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'api_cost_logs',
    'unit_cost_history',
    'products',
    'orders',
    'profiles',
    'wallets',
    'transactions'
  )
ORDER BY tablename;

-- ===============================================================================
-- 7. VERIFICAR POLÍTICAS CRIADAS
-- ===============================================================================

SELECT 
  '=== POLÍTICAS DE SEGURANÇA ===' as info;

SELECT 
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename IN (
  'api_cost_logs',
  'unit_cost_history',
  'products'
)
ORDER BY tablename, policyname;

-- ===============================================================================
-- 8. TESTAR ACESSO (como cliente)
-- ===============================================================================

-- Estas queries devem retornar vazio ou erro para clientes:
SELECT '=== TESTE DE ACESSO (deve falhar para clientes) ===' as info;

-- Tentar acessar custos (deve retornar vazio para clientes)
SELECT COUNT(*) as cost_logs_count FROM public.api_cost_logs;
SELECT COUNT(*) as cost_history_count FROM public.unit_cost_history;

-- Tentar acessar views financeiras (deve retornar vazio para clientes)
SELECT COUNT(*) as financial_kpis_count FROM public.admin_financial_kpis_secure;
SELECT COUNT(*) as profit_analysis_count FROM public.order_profit_analysis_secure;

-- ===============================================================================
-- RESULTADO ESPERADO
-- ===============================================================================
-- 
-- ✅ Todas as tabelas sensíveis com RLS habilitado
-- ✅ Políticas criadas para bloquear acesso de clientes
-- ✅ Views financeiras protegidas
-- ✅ Função is_admin() criada para verificações
-- 
-- Para clientes:
-- - api_cost_logs: 0 registros
-- - unit_cost_history: 0 registros
-- - admin_financial_kpis_secure: 0 registros
-- - order_profit_analysis_secure: 0 registros
-- 
-- Para admins:
-- - Acesso completo a todos os dados
-- 
-- ===============================================================================
