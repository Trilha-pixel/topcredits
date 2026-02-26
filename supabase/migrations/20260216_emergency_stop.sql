-- 🚨 EMERGENCY STOP SCRIPT 🚨
-- Drop triggers to stop any database-driven loops
DROP TRIGGER IF EXISTS on_order_buy_credits ON public.orders;
DROP FUNCTION IF EXISTS public.handle_buy_credits();

-- Drop any potential leftover triggers
DROP TRIGGER IF EXISTS webhook_buy_credits ON public.orders;

-- Safety: Verify if any other triggers exist on orders
-- SELECT event_object_table, trigger_name FROM information_schema.triggers WHERE event_object_table = 'orders';
