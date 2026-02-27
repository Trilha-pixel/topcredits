-- Adiciona rastreamento de usuário para licenças geradas
-- Execute no Supabase SQL Editor

-- Cria tabela local para rastrear licenças geradas por cada usuário
CREATE TABLE IF NOT EXISTS public.user_licenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  license_key TEXT NOT NULL,
  license_id TEXT, -- ID da licença na API externa
  plan_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_whatsapp TEXT NOT NULL,
  token_cost INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, license_key)
);

-- RLS: Usuários só veem suas próprias licenças
ALTER TABLE public.user_licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own licenses" ON public.user_licenses;
DROP POLICY IF EXISTS "Users can insert own licenses" ON public.user_licenses;

CREATE POLICY "Users can view own licenses" ON public.user_licenses
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own licenses" ON public.user_licenses
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_licenses_user_id ON public.user_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_licenses_license_key ON public.user_licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_user_licenses_created_at ON public.user_licenses(created_at DESC);

-- Comentários
COMMENT ON TABLE public.user_licenses IS 'Rastreia quais licenças foram geradas por cada usuário';
COMMENT ON COLUMN public.user_licenses.license_key IS 'Chave da licença gerada';
COMMENT ON COLUMN public.user_licenses.license_id IS 'ID da licença na API externa (se disponível)';
