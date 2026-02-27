-- 1. Cria a função que dispara o webhook (HTTP Request) para a Edge Function
CREATE OR REPLACE FUNCTION public.trigger_buy_credits()
RETURNS TRIGGER AS $$
BEGIN
    -- Dispara para a Edge Function 'buy-credits' quando um pedido é criado/atualizado com status 'completed' ou 'paid'
    -- E que ainda NAO tenha link de entrega
    IF (NEW.status = 'completed' OR NEW.status = 'paid') AND (NEW.delivery_link IS NULL OR NEW.delivery_link = '') THEN
        
        -- Faz a requisição HTTP (Webhook) para a Edge Function
        -- Nota: Em produção no Supabase, net.http_post deve estar habilitado (extensions) ou usar pg_net
        -- Mas aqui vamos usar a abordagem nativa de triggers do Supabase se estiver habilitado, ou simular.
        -- O jeito padrão moderno é usar Webhooks na UI, mas podemos tentar forçar via pg_net se disponível.
        
        -- Como não temos garantia do pg_net, o ideal é confiar no Webhook da UI.
        -- POREM, se você quer GARANTIR via codigo, o melhor é fazer a chamada na propria Edge Function 'create-order'
        -- ou garantir que a UI Webhook esteja correta.
        
        -- Vou deixar apenas o log aqui, pois a configuração do Webhook HTTP é externa ao SQL padrão.
        RAISE LOG 'Disparando automacao para pedido %', NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- O usuario disse que JA CRIOU o webhook na tabela orders.
-- Entao o problema deve ser o status ou o trigger nao estar batendo.

-- 2. Atualiza os pedidos antigos (opcional, só para teste)
-- UPDATE public.orders SET status = 'completed' WHERE status = 'paid';
