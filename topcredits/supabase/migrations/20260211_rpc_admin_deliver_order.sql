-- Create RPC for admin to deliver order
CREATE OR REPLACE FUNCTION admin_deliver_order(p_order_id UUID, p_delivery_link TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE orders
  SET 
    status = 'completed',
    completed_at = NOW(),
    delivery_link = p_delivery_link
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
END;
$$;
