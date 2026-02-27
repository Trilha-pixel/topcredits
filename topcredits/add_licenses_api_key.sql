-- Adicionar coluna licenses_api_key na tabela profiles
-- Execute este script no SQL Editor do Supabase

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS licenses_api_key TEXT;

-- Adicionar comentário para documentação
COMMENT ON COLUMN profiles.licenses_api_key IS 'API Key para integração com Leigos Academy Licenses API';

-- Criar índice para melhor performance (opcional)
CREATE INDEX IF NOT EXISTS idx_profiles_licenses_api_key ON profiles(licenses_api_key) 
WHERE licenses_api_key IS NOT NULL;
