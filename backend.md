# Plano de Implementação de Backend com PostgreSQL e Supabase

Este documento descreve o plano para migrar o projeto atual (SPA Vite + React) de dados mockados para um backend real utilizando PostgreSQL via Supabase. A escolha do Supabase baseia-se na arquitetura atual "Serverless/Client-side" do projeto, permitindo uma conexão robusta com PostgreSQL sem a necessidade de manter um servidor Node.js/Express separado, aproveitando o `@tanstack/react-query` já instalado para gerenciamento de estado assíncrono.

## 1. Arquitetura Proposta

*   **Frontend**: Vite + React (Atual).
*   **Backend/Database**: Supabase (PostgreSQL + Auth + Auto-generated API).
*   **Comunicação**: Cliente Supabase (`@supabase/supabase-js`) consumido via Hooks customizados e React Query.
*   **Autenticação**: Supabase Auth (Integrado à tabela `profiles`).

## 2. Dependências Necessárias

Com base no `package.json` atual, precisaremos adicionar apenas a biblioteca cliente do Supabase:

```bash
npm install @supabase/supabase-js
```

## 3. Modelagem do Banco de Dados (Schema)

O banco de dados PostgreSQL será estruturado para refletir os tipos definidos em `src/lib/mock-data.ts`.

### Tabelas Principais

#### `profiles` (Estende `auth.users`)
*   `id` (UUID, PK, FK -> auth.users.id)
*   `full_name` (Text)
*   `email` (Text)
*   `role` (Text - 'admin' | 'reseller')
*   `is_active` (Boolean)
*   `created_at` (Timestamp)

#### `wallets`
*   `id` (UUID, PK)
*   `user_id` (UUID, FK -> profiles.id)
*   `balance` (Decimal/Numeric)
*   `updated_at` (Timestamp)

#### `products`
*   `id` (Serial/Identity, PK)
*   `name` (Text)
*   `credits_amount` (Integer)
*   `price` (Decimal/Numeric)
*   `active` (Boolean)

#### `orders`
*   `id` (Text/UUID, PK)
*   `user_id` (UUID, FK -> profiles.id)
*   `product_id` (Integer, FK -> products.id)
*   `lovable_email` (Text)
*   `status` (Text - 'pending', 'processing', 'completed', 'cancelled')
*   `price_at_purchase` (Decimal)
*   `created_at` (Timestamp)
*   `completed_at` (Timestamp, Nullable)
*   `delivery_link` (Text, Nullable)

#### `transactions`
*   `id` (Text/UUID, PK)
*   `user_id` (UUID, FK -> profiles.id)
*   `type` (Text - 'deposit', 'purchase', 'refund')
*   `amount` (Decimal)
*   `external_id` (Text, Nullable)
*   `created_at` (Timestamp)

### Tabelas Academy

#### `academy_categories`
*   `id` (Text, PK)
*   `name` (Text)
*   `icon` (Text)

#### `academy_classes`
*   `id` (Text, PK)
*   `category_id` (Text, FK -> academy_categories.id)
*   `title` (Text)
*   `description` (Text)
*   `video_url` (Text)
*   `duration` (Text)
*   `order` (Integer)

#### `academy_downloads`
*   `id` (Text, PK)
*   `title` (Text)
*   `description` (Text)
*   `file_type` (Text)
*   `file_url` (Text)
*   `size` (Text)

## 4. Configuração do Projeto

1.  **Criar Projeto no Supabase**: Configurar um novo projeto para obter `SUPABASE_URL` e `SUPABASE_ANON_KEY`.
2.  **Variáveis de Ambiente**: Criar arquivo `.env` na raiz (não versionado).

```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_key_aqui
```

3.  **Cliente Supabase**: Criar `src/lib/supabase.ts` para inicializar o cliente.

## 5. Estratégia de Migração

### Fase 1: Setup e Database
1.  Executar script SQL no Supabase para criar as tabelas acima.
2.  Configurar **Row Level Security (RLS)** para proteger os dados (ex: usuários só veem suas próprias transações).
3.  Criar um script de "Seed" (pode ser um script .ts temporário) para popular o banco com os dados de `mock-data.ts`, garantindo que o frontend não quebre por falta de dados iniciais.

### Fase 2: Camada de Dados (Frontend)
Substituir o uso direto dos arrays de `mock-data.ts` por Hooks que utilizam `useQuery` do React Query.

**Exemplo de Refatoração:**

De:
```typescript
import { mockTransactions } from '@/lib/mock-data';
// Uso direto do array mockTransactions
```

Para:
```typescript
// src/hooks/useTransactions.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*');
      if (error) throw error;
      return data;
    },
  });
};
```

### Fase 3: Limpeza
1.  Remover `src/lib/mock-data.ts`.
2.  Verificar todas as páginas (`AdminDashboard`, `ResellerDashboard`, etc.) para garantir que nenhuma referência a dados estáticos permanece.

## 6. Próximos Passos Imediatos

1.  Instalar pacote `@supabase/supabase-js`.
2.  Criar o arquivo `src/lib/supabase.ts`.
3.  Executar os comandos SQL de criação de tabela (forneceremos o SQL exato na implementação).
