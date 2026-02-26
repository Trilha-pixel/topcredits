// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
}

Deno.serve(async (req) => {
    // 1. Tratamento de CORS (Preflight)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 2. Inicializa Supabase com SERVICE ROLE (Permissão Admin para escrever saldo)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // 3. Segurança: Verifica Token do Webhook (Opcional mas Recomendado)
        // Defina 'ASAAS_WEBHOOK_TOKEN' nos secrets se quiser ativar essa proteção
        const verificationToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN');
        if (verificationToken) {
            const headerToken = req.headers.get('asaas-access-token');
            if (headerToken !== verificationToken) {
                console.error('[Webhook] Unauthorized: Token inválido ou ausente');
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
            }
        }

        // 4. Parse do Payload do Asaas
        const body = await req.json()
        const { event, payment } = body

        // Se não tiver dados de pagamento, ignora (pode ser evento de teste ping)
        if (!payment) {
            return new Response(JSON.stringify({ message: 'Ignored: No payment data' }), { status: 200, headers: corsHeaders })
        }

        // 5. Filtragem de Eventos
        // Só nos interessa dinheiro confirmado na conta
        if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {

            const userId = payment.externalReference;
            const amount = payment.value;
            const paymentId = payment.id;

            // Validação de Segurança dos Dados
            if (!userId) {
                console.error('[Webhook] ERRO CRÍTICO: externalReference (User ID) não veio no payload.');
                // Retornamos 200 para o Asaas parar de tentar, pois é um erro irrecuperável
                return new Response(JSON.stringify({ error: 'Missing User ID' }), { status: 200, headers: corsHeaders })
            }

            console.log(`[Webhook] Processando: User ${userId} | R$ ${amount} | Asaas ID: ${paymentId}`);

            // 6. CHAMADA SEGURA (RPC)
            // Chamamos a função SQL que criamos no Passo 1
            const { data, error } = await supabaseAdmin.rpc('handle_new_deposit', {
                p_user_id: userId,
                p_amount: amount,
                p_payment_id: paymentId,
                p_description: `Depósito Pix (Asaas)`
            });

            if (error) {
                console.error('[Webhook] Erro na RPC:', error);
                // Se der erro no banco, retornamos 500 pro Asaas tentar de novo
                return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
            }

            // 7. Tratamento de Resposta da RPC
            if (data && data.status === 'duplicate') {
                console.log(`[Webhook] Idempotência: Pagamento ${paymentId} já foi processado. Ignorando.`);
                return new Response(JSON.stringify({ received: true, status: 'already_processed' }), { status: 200, headers: corsHeaders });
            }

            console.log(`[Webhook] SUCESSO! Novo saldo: R$ ${data.new_balance}`);
        } else {
            console.log(`[Webhook] Evento ignorado: ${event}`);
        }

        return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error('[Webhook] Erro Fatal:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    }
})