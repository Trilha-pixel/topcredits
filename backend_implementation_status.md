
# Status da Implementação de Backend (Supabase)

## Visão Geral
A migração de dados mockados para o Supabase foi concluída nas principais áreas do sistema (Admin e Revendedor).

## Componentes Refatorados

### 1. Camada de Dados (Hooks)
Foram criados hooks personalizados usando `@tanstack/react-query` para gerenciar o estado do servidor e cache.
- **`src/hooks/useAdminData.ts`**:
  - Busca `orders` (com joins de `profiles` e `products`), `resellers`, `wallets`, `transactions`, `products`.
  - Mutações: `updateOrderStatus`, `createProduct`, `updateProduct`.
- **`src/hooks/useResellerData.ts`**:
  - Busca dados específicos do usuário logado: `orders`, `transactions`.
  - Exposta função `refetch` para atualização manual.
- **`src/hooks/useProducts.ts`**:
  - Busca lista pública de produtos ativos.

### 2. Painéis (Dashboards)
- **`AdminDashboard.tsx`**:
  - Removidos todos os dados mockados.
  - Implementada aba de **Gestão de Produtos** (Criar/Editar/Ativar).
  - Implementada ação de **Entregar Pedido** (atualiza status e link).
  - Implementada ação de **Cancelar Pedido**.
  - Visualização de KPIs reais baseados no banco de dados.
- **`ResellerDashboard.tsx`**:
  - Conectado ao `useResellerData`.
  - Extrato financeiro e lista de pedidos reais.
  - `BalanceCard` atualizado para calcular saldo real.

### 3. Tipagem
- **`src/types/index.ts`**: Centralizada a definição de tipos (`Order`, `Product`, `Profile`, `Transaction`, `Wallet`) alinhada ao schema do Supabase.

## Ações Pendentes / Futuras
1.  **Convite de Usuários**: A função de "Convidar Revendedor" no Admin exibe um alerta. Para implementar o envio real de e-mail e criação de usuário sem logout, é necessária uma **Supabase Edge Function** (`supabase functions:new invite-user`), pois a API de administração (`supabase.auth.admin`) não pode ser usada no cliente por segurança.
2.  **Upload de Arquivos**: A entrega de pedidos atualmente aceita um link de texto. Para upload de arquivos, seria necessário configurar um Bucket no Supabase Storage.
3.  **Academy**: A seção Academy ainda utiliza alguns dados mockados (`mockCategories`, etc) em `src/pages/Academy.tsx`. Foi mantida assim pois o foco era o Dashboard Financeiro/Operacional.

## Como Testar
1.  Garanta que as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estejam no `.env`.
2.  Faça login com `felipemilagresalves@gmail.com` (Admin).
3.  Verifique se consegue ver os dados no Dashboard Admin.
4.  Crie um novo produto na aba "Produtos".
5.  Faça login com outro usuário (Revendedor) e verifique se o produto aparece e se os pedidos são carregados corretamente.
