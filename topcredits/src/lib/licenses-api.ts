// API Client for Leigos Academy License System
import { supabase } from './supabase';

const API_BASE_URL = 'https://api.leigosacademy.site';

// Cache da API Key para evitar múltiplas consultas
let cachedApiKey: string | null = null;

// Get API key from Supabase config table
const getApiKey = async (): Promise<string> => {
  try {
    // Retornar do cache se já tiver
    if (cachedApiKey) {
      return cachedApiKey;
    }

    // Buscar da tabela de configurações
    const { data, error } = await supabase
      .from('licenses_config')
      .select('api_key')
      .single();

    if (error) throw error;

    if (!data?.api_key) {
      throw new Error('API Key não configurada no sistema. Entre em contato com o administrador.');
    }

    // Armazenar no cache
    cachedApiKey = data.api_key;
    return cachedApiKey;
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao obter API Key');
  }
};

const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const apiKey = await getApiKey();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// Types
export interface Balance {
  reseller: string;
  token_balance: number;
}

export interface Plan {
  id: string;
  name: string;
  token_cost: number;
  duration_days: number;
}

export interface License {
  id: string;
  key: string;
  client_name: string;
  status: 'Ativa' | 'Expirada' | 'Bloqueada';
  plan: string;
  expires_at: string;
}

export interface LicensesResponse {
  licenses: License[];
  total: number;
  limit: number;
  offset: number;
}

export interface GenerateLicenseRequest {
  plan_id: string;
  client_name: string;
  client_whatsapp: string;
}

export interface GenerateLicenseResponse {
  success: boolean;
  key: string;
  plan: string;
  expires_at: string;
  token_cost: number;
}

export interface ValidateLicenseResponse {
  valid: boolean;
  status?: string;
  expires_at?: string;
  plan?: string;
  reseller?: string;
}

// API Methods
export const licensesAPI = {
  // Get balance - busca tokens locais e nome do revendedor
  async getBalance(): Promise<Balance> {
    try {
      // Buscar tokens locais do Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: tokensData, error: tokensError } = await supabase
        .from('licenses_tokens')
        .select('token_balance')
        .eq('user_id', user.id)
        .single();

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      return {
        reseller: profileData.full_name || 'Revendedor',
        token_balance: tokensData?.token_balance || 0
      };
    } catch (error: any) {
      console.error('Erro ao buscar saldo:', error);
      // Fallback para API externa se houver erro
      return fetchAPI('/reseller-api/balance');
    }
  },

  // Get plans
  // Get plans - Filtra apenas os planos que vendemos
  async getPlans(): Promise<{ plans: Plan[] }> {
    const response = await fetchAPI('/reseller-api/plans');
    
    console.log('[Licenses API] Planos disponíveis na API:', response.plans);
    
    // Filtra planos de 1 dia (3 tokens) e 7 dias (4 tokens)
    const allowedTokenCosts = [3, 4]; // tokens
    const filteredPlans = response.plans.filter((plan: Plan) => 
      allowedTokenCosts.includes(plan.token_cost)
    );
    
    console.log('[Licenses API] Planos filtrados:', filteredPlans);
    
    return { plans: filteredPlans };
  },

  // List licenses with filters
  async getLicenses(params?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<LicensesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return fetchAPI(`/reseller-api/licenses${query ? `?${query}` : ''}`);
  },

  // Generate commercial license
  async generateLicense(data: GenerateLicenseRequest): Promise<GenerateLicenseResponse> {
    // Primeiro, gera a licença na API externa
    const response = await fetchAPI('/reseller-api/licenses/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Se gerou com sucesso, debita do saldo local
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Mapear token_cost para preço em R$
      const PLAN_PRICES: Record<number, number> = {
        3: 39.90,  // 1 dia
        4: 97.90   // 7 dias
      };

      const priceInReais = PLAN_PRICES[response.token_cost] || (response.token_cost * 5);

      // Debitar do saldo
      const { data: paymentResult, error: paymentError } = await supabase.rpc('debit_license_payment', {
        p_user_id: user.id,
        p_amount: priceInReais,
        p_plan_name: response.plan,
        p_license_key: response.key
      });

      if (paymentError) {
        console.error('Erro ao debitar pagamento:', paymentError);
        throw new Error('Licença gerada mas erro ao processar pagamento. Entre em contato com o suporte.');
      }

      console.log('Pagamento processado:', paymentResult);
    } catch (error: any) {
      console.error('Erro no processamento do pagamento:', error);
      // Licença já foi gerada, então não vamos bloquear o fluxo
      // mas vamos logar o erro
    }

    return response;
  },

  // Generate trial license
  async generateTrialLicense(): Promise<GenerateLicenseResponse> {
    return fetchAPI('/reseller-api/licenses/trial', {
      method: 'POST',
    });
  },

  // Block license
  async blockLicense(licenseId: string): Promise<{ success: boolean }> {
    return fetchAPI('/reseller-api/licenses/block', {
      method: 'POST',
      body: JSON.stringify({ license_id: licenseId }),
    });
  },

  // Unblock license
  async unblockLicense(licenseId: string): Promise<{ success: boolean }> {
    return fetchAPI('/reseller-api/licenses/unblock', {
      method: 'POST',
      body: JSON.stringify({ license_id: licenseId }),
    });
  },

  // Validate license
  async validateLicense(key: string): Promise<ValidateLicenseResponse> {
    return fetchAPI('/validate-license', {
      method: 'POST',
      body: JSON.stringify({ key }),
    });
  },

  // Get latest release download URL
  async getLatestRelease(): Promise<{ download_url: string; version?: string }> {
    return fetchAPI('/download-latest-release');
  },
};
