
// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
    // Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    console.log(`[create-order] Nova requisição recebida: ${req.method}`);

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // 1. Auth Check (Manual Token Validation)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization Header');

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }

        // 2. Body Parsing
        const { productId, customerName } = await req.json();
        if (!productId) throw new Error('Product ID required');

        // 3. Get Product (with delivery link)
        const { data: product, error: prodError } = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (prodError || !product) {
            throw new Error('Produto não encontrado');
        }

        // 4. Check Balance
        const { data: wallet, error: walletError } = await supabaseClient
            .from('wallets')
            .select('balance')
            .eq('user_id', user.id)
            .single();

        // Se não tiver wallet, assume saldo 0
        let currentBalance = 0;
        if (wallet) {
            currentBalance = wallet.balance;
        } else if (walletError && walletError.code !== 'PGRST116') {
            throw walletError; // Erro real de banco
        }

        if (currentBalance < product.price) {
            return new Response(JSON.stringify({ error: 'Saldo insuficiente. Faça um depósito via PIX.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 5. Execute Transaction (Atomic-like)
        // 5.1 Debit Balance
        const newBalance = currentBalance - product.price;
        const { error: updateError } = await supabaseClient
            .from('wallets')
            .update({
                balance: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

        if (updateError) throw new Error('Falha ao debitar saldo: ' + updateError.message);

        // 5.2 Log Transaction
        await supabaseClient.from('transactions').insert({
            user_id: user.id,
            type: 'purchase',
            amount: product.price, // Negativo? Geralmente Purchase é positivo e type define saída
            status: 'completed',
            description: `Compra: ${product.name}`,
            date: new Date().toISOString()
        });

        // 5.3 Create Order (Pending Delivery)
        // Entrega manual pela equipe posteriormente (Staff)
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .insert({
                user_id: user.id,
                product_id: product.id,
                product_name: product.name,
                price_at_purchase: product.price,
                lovable_email: user.email,
                status: 'completed', // Pagamento via saldo = Concluído automaticamente
                delivery_link: null,
                created_at: new Date().toISOString(),
                quantity: product.credits_amount, // Automatiza quantidade para compra externa
                customer_name: customerName || null
            })
            .select()
            .single();

        if (orderError) throw new Error('Erro ao criar pedido: ' + orderError.message);

        // 6. Trigger Async Fulfillment (Fire and Forget)
        // Chamamos a função buy-credits para processar a entrega em segundo plano
        const functionsUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/buy-credits`;
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        const fulfillmentPromise = fetch(functionsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${serviceKey}`
            },
            body: JSON.stringify({ record: order })
        }).then(res => {
            console.log(`[create-order] Acionou buy-credits: ${res.status}`);
        }).catch(err => {
            console.error(`[create-order] Erro ao acionar buy-credits:`, err);
        });

        // Garante que a função continue rodando em background mesmo após responder ao usuário
        if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
            EdgeRuntime.waitUntil(fulfillmentPromise);
        } else {
            // Fallback para ambientes dev/test: não aguarda, mas corre risco de corte
            // Mas em produção no Supabase, waitUntil deve existir.
            console.log('EdgeRuntime.waitUntil não disponível, background fetch disparado.');
        }

        return new Response(JSON.stringify({ success: true, order }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[create-order] Erro Crítico:', error);
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
})
