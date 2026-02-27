-- 1. Promover seu usuário atual para Admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'felipemilagresalves@gmail.com';

-- IMPORTANTE:
-- O sistema está configurado para que todo novo usuário nasça como 'reseller' (revendedor) por segurança.
-- Quando você criar um novo usuário manualmente no Supabase Authentication que deva ser Admin,
-- execute o comando abaixo trocando o email:

-- UPDATE public.profiles SET role = 'admin' WHERE email = 'novo_admin@email.com';
