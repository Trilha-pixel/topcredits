// API Client for LVB Credits (Lovable Credits Reseller API)
// Documentation: https://api.lvbcredits.com/docs

const API_BASE_URL = 'https://api.lvbcredits.com';

// Get API key from environment
const getApiKey = (): string => {
  const apiKey = import.meta.env.VITE_LVB_CREDITS_API_KEY;
  if (!apiKey) {
    throw new Error('LVB Credits API Key não configurada. Configure VITE_LVB_CREDITS_API_KEY no .env');
  }
  return apiKey;
};

const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const apiKey = getApiKey();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      success: false, 
      error: `HTTP ${response.status}` 
    }));
    throw new Error(error.error || error.message || `Erro na requisição: ${response.status}`);
  }

  return response.json();
};

// Types
export interface BalanceResponse {
  success: boolean;
  data: {
    saldoCentavos: number;
    saldoReais: string;
  };
}

export interface QuoteResponse {
  success: boolean;
  data: {
    creditos: number;
    precoCentavos: number;
    precoReais: string;
    saldoAtualCentavos: number;
    saldoAtualReais: string;
    saldoSuficiente: boolean;
    precoUnitarioCentavos: number;
  };
}

export interface CreateOrderResponse {
  success: boolean;
  data: {
    pedidoId: string;
    creditos: number;
    valorCentavos: number;
    valorReais: string;
    status: 'aguardando' | 'processando' | 'concluido' | 'erro';
    linkCliente: string;
    novoSaldoCentavos: number;
    novoSaldoReais: string;
  };
}

// API Methods
export const lvbCreditsAPI = {
  /**
   * Consultar saldo atual da conta do revendedor
   */
  async getBalance(): Promise<BalanceResponse> {
    return fetchAPI('/api/v1/revenda/saldo');
  },

  /**
   * Calcular orçamento para uma quantidade de créditos
   * @param credits Quantidade de créditos (10-5000, múltiplos de 10)
   */
  async getQuote(credits: number): Promise<QuoteResponse> {
    if (credits < 10 || credits > 5000 || credits % 10 !== 0) {
      throw new Error('Quantidade de créditos deve ser entre 10 e 5000, em múltiplos de 10');
    }
    return fetchAPI(`/api/v1/revenda/orcamento?creditos=${credits}`);
  },

  /**
   * Criar um novo pedido de créditos
   * @param credits Quantidade de créditos (10-5000, múltiplos de 10)
   */
  async createOrder(credits: number): Promise<CreateOrderResponse> {
    if (credits < 10 || credits > 5000 || credits % 10 !== 0) {
      throw new Error('Quantidade de créditos deve ser entre 10 e 5000, em múltiplos de 10');
    }
    
    return fetchAPI('/api/v1/revenda/pedidos', {
      method: 'POST',
      body: JSON.stringify({ creditos: credits }),
    });
  },

  /**
   * Configurar tipo de entrega do pedido
   * @param orderId ID do pedido
   * @param deliveryType Tipo de entrega ('email' ou 'link')
   * @param deliveryData Dados de entrega (email ou informações do link)
   */
  async setDeliveryType(
    orderId: string, 
    deliveryType: 'email' | 'link',
    deliveryData: { email?: string; [key: string]: any }
  ): Promise<{ success: boolean }> {
    return fetchAPI(`/api/v1/revenda/pedidos/${orderId}/tipo-entrega`, {
      method: 'PUT',
      body: JSON.stringify({
        tipo: deliveryType,
        dados: deliveryData
      }),
    });
  },
};
