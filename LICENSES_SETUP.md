# Configuração do Sistema de Licenças Lovable

Este guia explica como configurar a integração com a API de Licenças da Leigos Academy.

## 📋 Pré-requisitos

- Conta ativa na plataforma Leigos Academy
- API Key válida (obtenha em: https://api.leigosacademy.site)
- Acesso ao painel Supabase do projeto

## 🗄️ Passo 1: Configurar o Banco de Dados

Execute os scripts SQL no **SQL Editor** do Supabase:

### 1.1 Criar tabela de configurações globais

```sql
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
      AND profiles.is_admin = true
    )
  );
```

**Localização no Supabase:**
1. Acesse seu projeto no Supabase
2. Vá em **SQL Editor** (menu lateral)
3. Clique em **New Query**
4. Cole o script acima
5. **IMPORTANTE:** Substitua `'SUA_API_KEY_AQUI'` pela sua API Key real
6. Clique em **Run** ou pressione `Ctrl+Enter`

## 🔑 Passo 2: Configurar a API Key

A API Key é configurada globalmente no Supabase e todos os revendedores usarão a mesma chave automaticamente.

### Atualizar a API Key (Apenas Admins)

Se precisar atualizar a API Key no futuro:

```sql
UPDATE licenses_config 
SET api_key = 'NOVA_API_KEY_AQUI', 
    updated_at = NOW();
```

## 🚀 Passo 3: Usar o Sistema de Licenças

### Acessar o Painel

1. **Dashboard do Revendedor:**
   - Na seção "Licenças Lovable", clique em qualquer card
   - Ou clique em "Ver Todas"

2. **Dashboard do Admin:**
   - Clique na aba "Licenças"
   - Ou acesse diretamente `/licencas`

### Funcionalidades Disponíveis

#### 📊 Dashboard
- Visualizar saldo de tokens (compartilhado)
- Ver estatísticas de licenças (ativas, expiradas, bloqueadas)
- Filtrar por status
- Buscar por cliente ou chave

#### ➕ Gerar Licenças
- **Licença Paga:** Selecione um plano, informe dados do cliente
- **Teste Grátis:** Gere uma licença temporária sem custo

#### 🔧 Gerenciar Licenças
- Copiar chave de licença
- Bloquear licença ativa
- Desbloquear licença bloqueada
- Ver data de expiração

## 🔌 Endpoints da API

A integração usa os seguintes endpoints:

- `GET /reseller-api/balance` - Consultar saldo
- `GET /reseller-api/plans` - Listar planos
- `GET /reseller-api/licenses` - Listar licenças
- `POST /reseller-api/licenses/generate` - Gerar licença paga
- `POST /reseller-api/licenses/trial` - Gerar teste grátis
- `POST /reseller-api/licenses/block` - Bloquear licença
- `POST /reseller-api/licenses/unblock` - Desbloquear licença
- `POST /validate-license` - Validar licença

## 🐛 Solução de Problemas

### "API Key não configurada no sistema"
- Verifique se você executou o script SQL corretamente
- Certifique-se de que substituiu `'SUA_API_KEY_AQUI'` pela chave real
- Verifique se a tabela `licenses_config` foi criada

### "Erro ao carregar dados"
- Verifique sua conexão com a internet
- Confirme que a API Key no Supabase é válida
- Verifique se você tem saldo de tokens suficiente

### "Usuário não autenticado"
- Faça logout e login novamente
- Limpe o cache do navegador

## 📚 Documentação da API

Para mais detalhes sobre a API, acesse:
https://api.leigosacademy.site/docs

## 🆘 Suporte

Em caso de dúvidas ou problemas:
- Contate o suporte da Leigos Academy
- Abra uma issue no repositório do projeto
