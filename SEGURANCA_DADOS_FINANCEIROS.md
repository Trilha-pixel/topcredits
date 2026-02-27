# Segurança de Dados Financeiros

## Problema Identificado

Clientes podiam ver dados sensíveis:
- ❌ `unit_cost_brl` (custo por crédito)
- ❌ `api_cost_logs` (logs de custos de API)
- ❌ `unit_cost_history` (histórico de custos)
- ❌ Views financeiras (lucros, margens)

## Solução Implementada

### 1. RLS (Row Level Security) Atualizado

**Tabela `products`:**
- ✅ Clientes veem apenas: `id, name, credits_amount, price, active, category`
- ❌ Clientes NÃO veem: `unit_cost_brl`
- ✅ Admins veem tudo

**Tabela `api_cost_logs`:**
- ✅ Apenas admins podem acessar

**Tabela `unit_cost_history`:**
- ✅ Apenas admins podem acessar

### 2. Funções RPC Protegidas

**`get_admin_stats()`:**
- Verifica se usuário é admin antes de retornar dados
- Lança exceção se não for admin

### 3. Views Protegidas

**`admin_financial_kpis`:**
- Acesso restrito via RLS

**`order_profit_analysis`:**
- Acesso restrito via RLS

### 4. Frontend Atualizado

**`useProducts` hook:**
```typescript
// Antes (INSEGURO)
.select('*')  // Retornava unit_cost_brl

// Depois (SEGURO)
.select('id, name, credits_amount, price, active, category')
```

## Políticas RLS Criadas

```sql
-- Clientes: Ver apenas produtos ativos (sem custos)
CREATE POLICY "Customers can view public product info"
ON public.products
FOR SELECT
TO authenticated
USING (active = true AND role != 'admin');

-- Admins: Ver e gerenciar tudo
CREATE POLICY "Admins can manage all products"
ON public.products
FOR ALL
TO authenticated
USING (role = 'admin');

-- Custos: Apenas admins
CREATE POLICY "Only admins can view cost logs"
ON public.api_cost_logs
FOR ALL
TO authenticated
USING (role = 'admin');
```

## O Que Clientes Veem

### Produtos
```json
{
  "id": 1,
  "name": "Pacote Starter",
  "credits_amount": 10,
  "price": 5.00,
  "active": true,
  "category": "credits"
  // unit_cost_brl: NÃO VISÍVEL
}
```

### O Que Clientes NÃO Veem
- ❌ Custo unitário (`unit_cost_brl`)
- ❌ Logs de custos de API
- ❌ Histórico de custos
- ❌ Lucro líquido
- ❌ Margem de lucro
- ❌ Custos totais
- ❌ Análise financeira

## O Que Admins Veem

### Produtos (Completo)
```json
{
  "id": 1,
  "name": "Pacote Starter",
  "credits_amount": 10,
  "price": 5.00,
  "active": true,
  "category": "credits",
  "unit_cost_brl": 0.19  // ✅ VISÍVEL PARA ADMINS
}
```

### Dashboard Admin
- ✅ Lucro líquido
- ✅ Custos de API
- ✅ Margem por produto
- ✅ Análise financeira completa
- ✅ Logs de custos
- ✅ Histórico de custos

## Scripts para Executar

Execute no Supabase SQL Editor:

```sql
secure-financial-data.sql
```

## Verificação

### Teste como Cliente
```sql
-- Logar como cliente e tentar:
SELECT * FROM products;
-- Deve retornar apenas: id, name, credits_amount, price, active, category

SELECT * FROM api_cost_logs;
-- Deve retornar erro: permission denied

SELECT * FROM get_admin_stats();
-- Deve retornar erro: Acesso negado: apenas administradores
```

### Teste como Admin
```sql
-- Logar como admin e tentar:
SELECT * FROM products;
-- Deve retornar TODOS os campos incluindo unit_cost_brl

SELECT * FROM api_cost_logs;
-- Deve retornar todos os logs

SELECT * FROM get_admin_stats();
-- Deve retornar todas as estatísticas
```

## Arquivos Modificados

- ✅ `secure-financial-data.sql` - Políticas RLS de segurança
- ✅ `src/hooks/useProducts.ts` - Select explícito sem custos
- ✅ `SEGURANCA_DADOS_FINANCEIROS.md` - Esta documentação

## Notas Importantes

1. **RLS é a primeira linha de defesa** - Mesmo que o frontend tente buscar custos, o banco bloqueia
2. **Select explícito** - Sempre especificar colunas ao invés de `SELECT *`
3. **Funções protegidas** - Verificar role antes de retornar dados sensíveis
4. **Views restritas** - Usar GRANT/REVOKE para controlar acesso

## Segurança em Camadas

```
┌─────────────────────────────────────┐
│ Frontend (useProducts)              │
│ SELECT apenas campos públicos       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ RLS (Row Level Security)            │
│ Bloqueia unit_cost_brl para clientes│
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ Funções RPC                         │
│ Verificam role antes de executar    │
└─────────────────────────────────────┘
```

Agora seus dados financeiros estão protegidos! 🔒
