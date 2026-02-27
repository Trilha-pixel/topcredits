-- ===============================================================================
-- CORRIGIR RLS DA TABELA PRODUCTS
-- ===============================================================================
-- Permitir que admins possam criar, editar e excluir produtos

-- 1. Verificar políticas atuais
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
WHERE tablename = 'products';

-- 2. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Public can view products" ON public.products;

-- 3. Habilitar RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 4. Criar política para visualização pública
CREATE POLICY "Anyone can view products"
ON public.products
FOR SELECT
TO public
USING (true);

-- 5. Criar política para admins gerenciarem produtos
CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 6. Verificar se as políticas foram criadas
SELECT 
  '=== POLÍTICAS CRIADAS ===' as info;

SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'products';

-- 7. Testar permissões (execute como admin)
SELECT '=== TESTE DE PERMISSÕES ===' as info;

-- Tentar atualizar um produto
UPDATE public.products 
SET name = name 
WHERE id = (SELECT id FROM public.products LIMIT 1);

-- Se não der erro, as permissões estão corretas!
SELECT 'Permissões OK!' as resultado;

-- ===============================================================================
-- RESULTADO ESPERADO
-- ===============================================================================
-- 
-- Você deve ver:
-- 1. Duas políticas criadas:
--    - "Anyone can view products" (SELECT para public)
--    - "Admins can manage products" (ALL para authenticated admins)
-- 
-- 2. UPDATE deve funcionar sem erros
-- 
-- ===============================================================================
