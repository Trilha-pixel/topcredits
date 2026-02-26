-- ===============================================================================
-- ADICIONA COLUNAS DE ENTREGA
-- ===============================================================================
-- Execute este script ANTES do setup-auto-delivery.sql

-- 1. Adiciona coluna delivery_link na tabela products
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS delivery_link TEXT;

-- 2. Adiciona colunas de entrega na tabela orders
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS delivery_link TEXT;

ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS delivery_code TEXT;

ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 3. Atualiza produtos existentes com links de exemplo
UPDATE products 
SET delivery_link = 'https://lovable.dev/redeem' 
WHERE delivery_link IS NULL;

-- 4. Adiciona índice para performance
CREATE INDEX IF NOT EXISTS idx_orders_delivery_code 
  ON orders(delivery_code) 
  WHERE delivery_code IS NOT NULL;

-- 5. Verificar
SELECT 
  'Colunas adicionadas com sucesso!' as message,
  COUNT(*) as total_produtos
FROM products
WHERE delivery_link IS NOT NULL;
