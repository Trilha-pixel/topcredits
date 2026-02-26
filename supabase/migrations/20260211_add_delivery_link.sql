
-- Adiciona coluna delivery_link na tabela products para armazenar o link de entrega (ex: link de resgate)
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_link TEXT;

-- Garante que orders também tenha (embora o type diga que tem)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_link TEXT;

-- Atualiza produtos existentes com um link de exemplo (opcional)
UPDATE products SET delivery_link = 'https://lovable.dev/redeem?code=EXAMPLE' WHERE delivery_link IS NULL;
