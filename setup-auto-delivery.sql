-- ===============================================================================
-- SETUP: Entrega Automática de Créditos Lovable
-- ===============================================================================
-- Este script configura a entrega automática quando um pedido é pago/completo
-- Requer: Edge Function 'buy-credits' deployada no Supabase

-- 1. Habilita a extensão pg_net para chamadas HTTP
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Cria a função de trigger para entrega automática
CREATE OR REPLACE FUNCTION public.handle_buy_credits()
RETURNS TRIGGER AS $$
DECLARE
  project_url TEXT := 'https://baxxzefbhhnlmyxpeuew.supabase.co/functions/v1/buy-credits';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheHh6ZWZiaGhubG15eHBldWV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NzM5MzIsImV4cCI6MjA4NjM0OTkzMn0.x5VH2oTEZiIsklvl6gr7_ApBpCX88YLPBD69Br9ec8A';
  request_id BIGINT;
BEGIN
  -- Só processa se o pedido foi marcado como pago/completo E ainda não tem link de entrega
  IF (NEW.status = 'completed' OR NEW.status = 'paid') 
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND (NEW.delivery_link IS NULL OR NEW.delivery_link = '') 
  THEN
    -- Chama a Edge Function para processar a entrega
    SELECT net.http_post(
      url := project_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      ),
      body := jsonb_build_object(
        'order_id', NEW.id,
        'user_id', NEW.user_id,
        'product_id', NEW.product_id,
        'credits_amount', NEW.credits_amount,
        'lovable_email', NEW.lovable_email,
        'price', NEW.price_at_purchase
      )
    ) INTO request_id;
    
    -- Log da requisição (opcional)
    RAISE NOTICE 'Entrega automática iniciada para pedido % - Request ID: %', NEW.id, request_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Cria o trigger na tabela orders
DROP TRIGGER IF EXISTS on_order_buy_credits ON public.orders;

CREATE TRIGGER on_order_buy_credits
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_buy_credits();

-- 4. Adiciona índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_orders_status_delivery 
  ON public.orders(status, delivery_link) 
  WHERE delivery_link IS NULL;

-- 5. Adiciona coluna para rastrear tentativas de entrega (opcional)
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS delivery_attempts INTEGER DEFAULT 0;

ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS last_delivery_attempt TIMESTAMPTZ;

-- 6. Função para reprocessar entregas falhadas
CREATE OR REPLACE FUNCTION public.retry_failed_deliveries()
RETURNS TABLE(order_id UUID, status TEXT) AS $$
DECLARE
  order_record RECORD;
BEGIN
  FOR order_record IN 
    SELECT id, status
    FROM public.orders
    WHERE (status = 'completed' OR status = 'paid')
      AND delivery_link IS NULL
      AND delivery_attempts < 3
      AND (last_delivery_attempt IS NULL 
           OR last_delivery_attempt < NOW() - INTERVAL '5 minutes')
  LOOP
    -- Atualiza para forçar o trigger
    UPDATE public.orders
    SET 
      delivery_attempts = delivery_attempts + 1,
      last_delivery_attempt = NOW()
    WHERE id = order_record.id;
    
    order_id := order_record.id;
    status := 'retrying';
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Verificar configuração
SELECT 
  'Trigger configurado!' as message,
  COUNT(*) as pedidos_pendentes_entrega
FROM public.orders
WHERE (status = 'completed' OR status = 'paid')
  AND delivery_link IS NULL;

-- ===============================================================================
-- INSTRUÇÕES DE USO
-- ===============================================================================
-- 
-- 1. Execute este script no Supabase SQL Editor
-- 
-- 2. Deploy da Edge Function (veja: supabase/functions/buy-credits/index.ts)
--    $ supabase functions deploy buy-credits
-- 
-- 3. Teste manual:
--    UPDATE orders SET status = 'completed' WHERE id = 'seu-order-id';
-- 
-- 4. Reprocessar entregas falhadas:
--    SELECT * FROM retry_failed_deliveries();
-- 
-- 5. Ver logs:
--    SELECT * FROM net._http_response ORDER BY created DESC LIMIT 10;
-- 
-- ===============================================================================
