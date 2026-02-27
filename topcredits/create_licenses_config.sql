-- Criar tabela de configurações globais para licenças
CREATE TABLE IF NOT EXISTS licenses_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar comentário
COMMENT ON TABLE licenses_config IS 'Configurações globais da API de Licenças Lovable';

-- Inserir configuração inicial (substitua 'SUA_API_KEY_AQUI' pela chave real)
INSERT INTO licenses_config (api_key) 
VALUES ('SUA_API_KEY_AQUI')
ON CONFLICT DO NOTHING;

-- Criar política RLS para permitir leitura apenas
ALTER TABLE licenses_config ENABLE ROW LEVEL SECURITY;

-- Permitir que usuários autenticados leiam a configuração
CREATE POLICY "Usuários autenticados podem ler configurações"
  ON licenses_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admins podem atualizar (opcional)
CREATE POLICY "Apenas admins podem atualizar configurações"
  ON licenses_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
