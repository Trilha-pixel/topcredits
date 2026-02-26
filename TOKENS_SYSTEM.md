# Sistema de Tokens para Licenças Lovable

## Visão Geral

O sistema de tokens permite que revendedores comprem tokens usando o saldo da plataforma e utilizem esses tokens para gerar licenças da extensão Lovable.

## Preço

- **1 Token = R$ 5,00**
- Os tokens são debitados automaticamente do saldo do revendedor na plataforma

## Fluxo de Compra

1. Revendedor acessa a página `/licencas`
2. Clica em "Comprar Tokens" no card de saldo
3. Define a quantidade de tokens desejada
4. Sistema verifica se há saldo suficiente
5. Se sim: debita do saldo e adiciona tokens
6. Se não: redireciona para fazer depósito

## Fluxo de Uso

1. Ao gerar uma licença paga, o sistema verifica o saldo de tokens
2. Se houver tokens suficientes: gera a licença e debita os tokens
3. Se não houver: exibe mensagem e abre modal de compra

## Estrutura do Banco de Dados

### Tabela `licenses_tokens`

```sql
CREATE TABLE licenses_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  token_balance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Função `purchase_tokens`

```sql
purchase_tokens(
  p_user_id UUID,
  p_tokens_amount INTEGER,
  p_total_cost DECIMAL
)
```

**Operações:**
1. Verifica saldo na carteira
2. Debita o valor total (tokens × R$ 5,00)
3. Adiciona tokens ao saldo do usuário
4. Registra transação no histórico

## Integração com API Externa

O sistema mantém compatibilidade com a API externa da Leigos Academy:
- Tokens locais são usados para controle de saldo
- API externa é usada para gerar/gerenciar licenças
- Sincronização automática entre sistemas

## Setup

1. Execute o SQL em `create_purchase_tokens_function.sql` no Supabase
2. Certifique-se de que a tabela `licenses_config` tem a API Key configurada
3. Revendedores precisam ter saldo na carteira para comprar tokens

## Segurança

- RLS habilitado na tabela `licenses_tokens`
- Usuários veem apenas seus próprios tokens
- Admins podem ver tokens de todos os usuários
- Função `purchase_tokens` usa SECURITY DEFINER para garantir integridade

## Monitoramento

Admins podem visualizar:
- Total de tokens em circulação
- Histórico de compras via tabela `transactions`
- Saldo de tokens por revendedor
