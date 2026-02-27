// Cost Tracking - Integração com Edge Functions para custos reais (server-side)
import { supabase } from './supabase';

/**
 * Busca o custo unitário real via Edge Function (server-side)
 * A API key fica segura no Supabase Secrets
 * @returns Custo unitário em reais
 */
export async function fetchRealUnitCost(): Promise<number> {
  try {
    const { data, error } = await supabase.functions.invoke('get-unit-cost', {
      method: 'POST',
    });

    if (error) throw error;

    if (data?.success && data?.data) {
      console.log(`💰 Custo unitário atualizado: R$ ${data.data.unitCostBrl.toFixed(4)}`);
      return data.data.unitCostBrl;
    }
    
    throw new Error('Falha ao obter custo unitário');
  } catch (error) {
    console.error('Erro ao buscar custo unitário:', error);
    // Fallback: retornar custo estimado (R$ 0.50 = 50 centavos)
    return 0.50;
  }
}

/**
 * Atualiza os custos unitários dos produtos de créditos no banco
 * Busca o custo real via Edge Function (server-side)
 */
export async function updateProductCosts(): Promise<void> {
  try {
    // A Edge Function já atualiza os produtos automaticamente
    const unitCostReais = await fetchRealUnitCost();
    console.log('✅ Custos dos produtos atualizados com sucesso');
    return;
  } catch (error) {
    console.error('❌ Erro ao atualizar custos dos produtos:', error);
    throw error;
  }
}

/**
 * Registra o custo de API de um pedido específico
 * @param orderId ID do pedido
 * @param creditsAmount Quantidade de créditos comprados
 */
export async function logOrderCost(orderId: string, creditsAmount: number): Promise<void> {
  try {
    // Buscar custo unitário atual do banco (já atualizado pela Edge Function)
    const { data: costHistory } = await supabase
      .from('unit_cost_history')
      .select('cost_per_credit_brl')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const unitCostReais = costHistory?.cost_per_credit_brl || 0.50;
    const totalCost = unitCostReais * creditsAmount;

    // Registrar na tabela api_cost_logs
    const { error } = await supabase
      .from('api_cost_logs')
      .insert({
        order_id: orderId,
        api_endpoint: '/api/v1/revenda/pedidos',
        request_count: 1,
        cost_per_request: totalCost,
      });

    if (error) {
      console.error('Erro ao registrar custo do pedido:', error);
    } else {
      console.log(`📊 Custo registrado: R$ ${totalCost.toFixed(2)} para pedido ${orderId}`);
    }
  } catch (error) {
    console.error('Erro ao logar custo do pedido:', error);
  }
}

/**
 * Calcula o lucro de um pedido específico
 * @param priceAtPurchase Preço pago pelo cliente
 * @param creditsAmount Quantidade de créditos
 * @returns Objeto com receita, custo e lucro
 */
export async function calculateOrderProfit(
  priceAtPurchase: number,
  creditsAmount: number
): Promise<{ revenue: number; cost: number; profit: number; margin: number }> {
  try {
    // Buscar custo unitário atual do banco
    const { data: costHistory } = await supabase
      .from('unit_cost_history')
      .select('cost_per_credit_brl')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const unitCostReais = costHistory?.cost_per_credit_brl || 0.50;
    const totalCost = unitCostReais * creditsAmount;
    const profit = priceAtPurchase - totalCost;
    const margin = priceAtPurchase > 0 ? (profit / priceAtPurchase) * 100 : 0;

    return {
      revenue: priceAtPurchase,
      cost: totalCost,
      profit,
      margin,
    };
  } catch (error) {
    console.error('Erro ao calcular lucro:', error);
    return {
      revenue: priceAtPurchase,
      cost: 0,
      profit: priceAtPurchase,
      margin: 100,
    };
  }
}

/**
 * Busca estatísticas de custo em tempo real via Edge Function
 * Útil para o dashboard admin
 */
export async function getCostStatistics(): Promise<{
  currentUnitCost: number;
  estimatedMonthlyCost: number;
  averageMargin: number;
  totalCreditsThisMonth?: number;
  totalRevenueThisMonth?: number;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('get-cost-statistics', {
      method: 'POST',
    });

    if (error) throw error;

    if (data?.success && data?.data) {
      return data.data;
    }

    throw new Error('Falha ao obter estatísticas');
  } catch (error) {
    console.error('Erro ao buscar estatísticas de custo:', error);
    return {
      currentUnitCost: 0.50,
      estimatedMonthlyCost: 0,
      averageMargin: 0,
    };
  }
}
