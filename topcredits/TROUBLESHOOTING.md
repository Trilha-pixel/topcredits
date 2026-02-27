# Troubleshooting - Top Créditos

## Erro 401 Unauthorized na função create-order

### Sintomas
- POST retorna 401 Unauthorized
- Console mostra: `Edge Function returned a non-2xx status code`

### Causas Possíveis

1. **Token Expirado**
   - Verifique no console: `Token expires at`
   - Se a data for passada, faça logout e login novamente

2. **Sessão Inválida**
   - Limpe o localStorage: `localStorage.clear()`
   - Faça login novamente

3. **Função não está recebendo o token**
   - Verifique se `supabase.functions.invoke()` está sendo usado corretamente
   - O Supabase JS automaticamente adiciona o header Authorization

### Solução Rápida

1. Abra o console do navegador (F12)
2. Execute:
```javascript
// Ver sessão atual
const { data } = await supabase.auth.getSession()
console.log('Session:', data.session)
console.log('Expires:', new Date(data.session.expires_at * 1000))

// Se expirado, refresh
const { data: refreshData } = await supabase.auth.refreshSession()
console.log('New session:', refreshData.session)
```

3. Ou simplesmente faça logout e login novamente

### Debug na Edge Function

Verifique os logs no Supabase Dashboard:
- Edge Functions → create-order → Logs
- Procure por `[create-order]` nos logs
- Veja se aparece "User authenticated" ou erro de auth

### Teste Manual

Teste a função diretamente com curl:

```bash
# Obtenha seu access_token do localStorage ou console
# localStorage.getItem('sb-ruttbgufwmrmmdjdyftn-auth-token')

curl -X POST https://ruttbgufwmrmmdjdyftn.supabase.co/functions/v1/create-order \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"productId": 1}'
```

Se retornar 401, o problema é no token.
Se retornar 400 com mensagem de erro, o problema é na lógica.
