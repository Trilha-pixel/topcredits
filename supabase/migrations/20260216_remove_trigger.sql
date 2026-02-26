-- Remove o gatilho que está causando duplicidade (conflito com a chamada direta)
DROP TRIGGER IF EXISTS on_order_buy_credits ON public.orders;
DROP FUNCTION IF EXISTS public.handle_buy_credits();
