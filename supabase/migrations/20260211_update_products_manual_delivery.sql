
-- Inserir produtos de Revenda (Sem link de entrega automático)
-- A entrega será feita manualmente pela equipe posteriormente.

INSERT INTO products (name, credits_amount, price, active, delivery_link) VALUES
('Pacote Starter', 50, 8.90, true, NULL),
('Pacote Básico', 100, 10.90, true, NULL),
('Pacote Avançado', 300, 24.90, true, NULL),
('Pacote Pro', 500, 45.90, true, NULL),
('Pacote Expert', 1000, 69.90, true, NULL),
('Pacote Business', 2000, 119.90, true, NULL),
('Pacote Enterprise', 5000, 189.90, true, NULL)
ON CONFLICT (name) DO UPDATE 
SET 
  credits_amount = EXCLUDED.credits_amount,
  price = EXCLUDED.price,
  active = true,
  delivery_link = NULL; -- Garante que limpe qualquer link antigo se houver
