-- Add external_order_id column to orders table
-- This stores the order ID from LVB Credits API

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS external_order_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_external_order_id 
ON orders(external_order_id);

-- Add comment
COMMENT ON COLUMN orders.external_order_id IS 'ID do pedido na API externa (LVB Credits)';
