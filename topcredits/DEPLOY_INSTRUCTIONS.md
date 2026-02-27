# 🚀 Instruções de Deploy - Top Créditos

## Ordem de Execução (IMPORTANTE!)

### 1️⃣ Configurar Supabase (SQL Editor)

Execute os scripts SQL nesta ordem exata:

```bash
# 1. Schema principal (cria todas as tabelas)
supabase-schema.sql

# 2. Corrige recursão RLS (se necessário)
fix-rls-recursion.sql

# 3. Adiciona colunas de entrega
add-delivery-links.sql

# 4. Configura entrega automática
setup-auto-delivery.sql

# 5. Cria usuário admin (opcional)
create-admin.sql
```

### 2️⃣ Configurar Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha:

```env
# Supabase (obrigatório)
VITE_SUPABASE_URL=https://baxxzefbhhnlmyxpeuew.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui

# APIs Externas (opcional - para produção)
LOVABLE_API_KEY=sua_lovable_api_key
RESEND_API_KEY=sua_resend_api_key
```

### 3️⃣ Deploy das Edge Functions

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Login no Supabase
supabase login

# Link com seu projeto
supabase link --project-ref ruttbgufwmrmmdjdyftn

# Deploy de todas as funções (use o script)
# Windows PowerShell:
.\deploy-functions.ps1

# Linux/Mac:
chmod +x deploy-functions.sh
./deploy-functions.sh

# Ou deploy individual:
supabase functions deploy create-order
supabase functions deploy create-payment-pix
supabase functions deploy buy-credits
supabase functions deploy cancel-order
supabase functions deploy get-order-details
supabase functions deploy update-order-delivery
supabase functions deploy invite-user
supabase functions deploy asaas-webhook

# Configurar secrets (produção)
supabase secrets set LOVABLE_API_KEY=sua_key
supabase secrets set RESEND_API_KEY=sua_key
supabase secrets set ASAAS_API_KEY=sua_key
```

**⚠️ IMPORTANTE - CORS Fix:**
Todas as Edge Functions foram atualizadas para retornar status 200 explícito no preflight OPTIONS. Se você ainda tiver erros CORS após o deploy, verifique:
1. Se o deploy foi concluído com sucesso
2. Se o cache do navegador foi limpo (Ctrl+Shift+R)
3. Se a URL da função está correta no frontend

### 4️⃣ Testar o Sistema

```bash
# 1. Instalar dependências
npm install

# 2. Rodar em desenvolvimento
npm run dev

# 3. Testar fluxo completo:
# - Fazer login
# - Comprar créditos
# - Verificar se pedido foi criado
# - Marcar pedido como 'paid' no Supabase
# - Verificar se delivery_link foi gerado automaticamente
```

## 🔍 Verificar se Está Funcionando

### No Supabase SQL Editor:

```sql
-- Ver pedidos pendentes de entrega
SELECT id, status, delivery_link, created_at
FROM orders
WHERE status IN ('completed', 'paid')
ORDER BY created_at DESC;

-- Ver logs de entrega
SELECT * 
FROM net._http_response 
ORDER BY created AT DESC 
LIMIT 10;

-- Reprocessar entregas falhadas
SELECT * FROM retry_failed_deliveries();
```

## 📋 Checklist de Deploy

- [ ] Executou `supabase-schema.sql`
- [ ] Executou `fix-rls-recursion.sql`
- [ ] Executou `add-delivery-links.sql`
- [ ] Executou `setup-auto-delivery.sql`
- [ ] Configurou `.env` com credenciais Supabase
- [ ] Deploy da Edge Function `buy-credits`
- [ ] Testou criar pedido
- [ ] Testou marcar pedido como paid
- [ ] Verificou se delivery_link foi gerado
- [ ] (Opcional) Configurou LOVABLE_API_KEY
- [ ] (Opcional) Configurou RESEND_API_KEY

## ⚠️ Problemas Comuns

### CORS Error ao chamar Edge Functions?

**Sintoma:** `Access to fetch has been blocked by CORS policy` ou `Failed to send a request to the Edge Function`

**Solução:**
1. Verifique se todas as funções foram deployadas após o fix CORS:
```bash
# Re-deploy todas as funções
.\deploy-functions.ps1  # Windows
./deploy-functions.sh   # Linux/Mac
```

2. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)

3. Verifique se a função está respondendo corretamente ao OPTIONS:
```bash
curl -X OPTIONS https://ruttbgufwmrmmdjdyftn.supabase.co/functions/v1/create-order \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  -v
```

Deve retornar status 200 com headers CORS.

4. Verifique os logs da função no Supabase Dashboard para ver se há erros internos

### Entrega não está funcionando?

1. Verifique se a extensão `pg_net` está habilitada:
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

2. Verifique se o trigger existe:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_order_buy_credits';
```

3. Veja os logs da Edge Function no Supabase Dashboard

### RLS bloqueando operações?

Execute `fix-rls-recursion.sql` novamente.

## 🎯 Próximos Passos (Produção)

1. Implementar integração real com API do Lovable
2. Configurar envio de emails de confirmação
3. Implementar webhook de pagamento (Stripe/Mercado Pago)
4. Adicionar monitoramento de entregas falhadas
5. Configurar alertas para erros

## 📞 Suporte

Se algo não funcionar, verifique:
- Console do navegador (F12)
- Logs do Supabase (Dashboard > Logs)
- Logs da Edge Function (Dashboard > Edge Functions > buy-credits > Logs)
