-- Script para criar primeiro usuário ADMIN
-- Execute este script APÓS criar o usuário via Supabase Auth

-- 1. Primeiro, crie o usuário via Supabase Dashboard:
--    Authentication → Users → Add User
--    Email: admin@topcreditos.com.br
--    Password: (escolha uma senha forte)

-- 2. Depois, execute este script substituindo o email:

-- Atualizar role para admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@topcreditos.com.br';

-- Adicionar saldo inicial (opcional)
UPDATE public.wallets 
SET balance = 1000.00 
WHERE user_id = (
  SELECT id FROM public.profiles 
  WHERE email = 'admin@topcreditos.com.br'
);

-- Adicionar tokens de licença (opcional)
UPDATE public.licenses_tokens 
SET token_balance = 100 
WHERE user_id = (
  SELECT id FROM public.profiles 
  WHERE email = 'admin@topcreditos.com.br'
);

-- Verificar se foi criado corretamente
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role,
  w.balance,
  lt.token_balance
FROM public.profiles p
LEFT JOIN public.wallets w ON w.user_id = p.id
LEFT JOIN public.licenses_tokens lt ON lt.user_id = p.id
WHERE p.email = 'admin@topcreditos.com.br';
