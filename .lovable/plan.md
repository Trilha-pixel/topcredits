
# Remover campo de e-mail Lovable do cliente

## Resumo
Remover todas as referencias ao "e-mail Lovable do cliente" da plataforma -- tanto do modal de compra quanto dos cards e detalhes de pedidos. O campo nao e necessario para o fluxo do revendedor.

## Alteracoes

### 1. `src/components/reseller/PurchaseModal.tsx`
- Remover o estado `email` e o campo de input de e-mail
- Remover o `Label` e `Input` imports
- Simplificar o formulario: manter apenas o resumo do pacote e o botao "Confirmar Pedido"
- O botao nao precisa mais estar desabilitado (sem validacao de e-mail)
- Toast simplificado: "Pedido de {produto} realizado com sucesso!"

### 2. `src/components/reseller/OrderCard.tsx`
- Remover a funcao `copyEmail`
- Remover a linha que exibe `order.lovable_email` com o botao de copiar
- Manter apenas o preco na linha inferior

### 3. `src/components/reseller/OrderDetailSheet.tsx`
- Remover o bloco "E-mail Lovable" da secao de informacoes do pedido
- Manter apenas "Produto" e o valor

### 4. Detalhes Tecnicos
- O campo `lovable_email` continua existindo no tipo `Order` e nos mock data (nao quebra nada) -- pode ser removido futuramente quando houver backend
- Nenhuma dependencia nova necessaria
- AdminDashboard mantem o e-mail pois o admin precisa dessa informacao para processar entregas
