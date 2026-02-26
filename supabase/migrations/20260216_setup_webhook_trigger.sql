-- 1. Cria a função que prepara e envia o payload para a Edge Function
CREATE OR REPLACE FUNCTION public.handle_buy_credits()
RETURNS TRIGGER AS $$
DECLARE
    project_url TEXT := 'https://baxxzefbhhnlmyxpeuew.supabase.co/functions/v1/buy-credits';
    anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheHh6ZWZiaGhubG15eHBldWV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NzM5MzIsImV4cCI6MjA4NjM0OTkzMn0.x5VH2oTEZiIsklvl6gr7_ApBpCX88YLPBD69Br9ec8A';
    request_id BIGINT;
BEGIN
    -- Verifica se deve disparar: status completed/paid e sem link de entrega
    IF (NEW.status = 'completed' OR NEW.status = 'paid') AND (NEW.delivery_link IS NULL OR NEW.delivery_link = '') THEN
        
        -- Usa a extensão pg_net para fazer a chamada HTTP Assíncrona
        -- Certifique-se de habilitar a extensão 'pg_net' no seu banco Supabase (Database > Extensions)
        SELECT net.http_post(
            url := project_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || anon_key
            ),
            body := jsonb_build_object('record', row_to_json(NEW))
        ) INTO request_id;

        RAISE NOTICE 'Disparada Edge Function buy-credits para pedido %. Request ID: %', NEW.id, request_id;
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Erro ao disparar webhook buy-credits: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Cria o Trigger que monitora INSERT e UPDATE na tabela orders
DROP TRIGGER IF EXISTS on_order_buy_credits ON public.orders;

CREATE TRIGGER on_order_buy_credits
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_buy_credits();

-- 3. Habilita a extensão pg_net (caso não esteja habilitada)
CREATE EXTENSION IF NOT EXISTS pg_net;
