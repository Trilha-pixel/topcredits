// Mensagens de erro amigáveis para o usuário

export const getErrorMessage = (error: any): string => {
  // Se já tem uma mensagem customizada, usar ela
  if (error?.message && !error.message.includes('HTTP')) {
    return error.message;
  }

  // Extrair código de status HTTP
  const statusMatch = error?.message?.match(/HTTP (\d+)/);
  const status = statusMatch ? parseInt(statusMatch[1]) : null;

  // Mensagens específicas por código HTTP
  switch (status) {
    case 400:
      return 'Dados inválidos. Verifique se todos os campos foram preenchidos corretamente e tente novamente.';
    
    case 401:
      return 'Não autorizado. Sua sessão pode ter expirado. Faça login novamente.';
    
    case 403:
      return 'Acesso negado. Você não tem permissão para realizar esta ação. Entre em contato com o administrador.';
    
    case 404:
      return 'Recurso não encontrado. O item solicitado não existe ou foi removido.';
    
    case 405:
      return 'Método não permitido. Esta operação não é suportada.';
    
    case 409:
      return 'Conflito. Este recurso já existe ou está em uso.';
    
    case 422:
      return 'Dados inválidos. Verifique as informações fornecidas e tente novamente.';
    
    case 429:
      return 'Muitas requisições. Aguarde alguns instantes antes de tentar novamente.';
    
    case 500:
      return 'Erro no servidor. Tente novamente em alguns instantes. Se o problema persistir, entre em contato com o suporte.';
    
    case 502:
      return 'Servidor temporariamente indisponível. Tente novamente em alguns instantes.';
    
    case 503:
      return 'Serviço em manutenção. Tente novamente mais tarde.';
    
    case 504:
      return 'Tempo de resposta excedido. Verifique sua conexão e tente novamente.';
    
    default:
      // Mensagem genérica se não identificar o erro
      if (error?.message) {
        return `Erro: ${error.message}`;
      }
      return 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.';
  }
};

// Mensagens específicas para operações de licenças
export const getLicenseErrorMessage = (error: any, operation: 'generate' | 'trial' | 'block' | 'unblock' | 'load'): string => {
  const baseMessage = getErrorMessage(error);
  
  // Adicionar contexto específico da operação
  const contextMessages: Record<typeof operation, string> = {
    generate: 'Não foi possível gerar a licença. ',
    trial: 'Não foi possível gerar a licença de teste. ',
    block: 'Não foi possível bloquear a licença. ',
    unblock: 'Não foi possível desbloquear a licença. ',
    load: 'Não foi possível carregar as licenças. ',
  };

  // Verificar erros específicos de saldo
  if (error?.message?.toLowerCase().includes('saldo') || 
      error?.message?.toLowerCase().includes('token') ||
      error?.message?.toLowerCase().includes('balance')) {
    return 'Saldo de tokens insuficiente. Compre mais tokens para gerar licenças.';
  }

  // Verificar erros de API Key
  if (error?.message?.toLowerCase().includes('api key') || 
      error?.message?.toLowerCase().includes('unauthorized')) {
    return 'Erro de autenticação com o servidor. Entre em contato com o administrador para verificar a configuração da API Key.';
  }

  return contextMessages[operation] + baseMessage;
};

// Mensagens específicas para operações de tokens
export const getTokenErrorMessage = (error: any, operation: 'buy' | 'check'): string => {
  const baseMessage = getErrorMessage(error);
  
  // Verificar erros específicos de saldo
  if (error?.message?.toLowerCase().includes('saldo insuficiente')) {
    return 'Você não tem saldo suficiente para comprar tokens. Faça um depósito primeiro.';
  }

  if (error?.message?.toLowerCase().includes('carteira não encontrada')) {
    return 'Carteira não encontrada. Entre em contato com o suporte.';
  }

  const contextMessages: Record<typeof operation, string> = {
    buy: 'Não foi possível comprar tokens. ',
    check: 'Não foi possível verificar seu saldo. ',
  };

  return contextMessages[operation] + baseMessage;
};
