// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
    // Preflight - MUST return 200 status
    if (req.method === 'OPTIONS') {
        return new Response(null, { 
            status: 200,
            headers: corsHeaders 
        });
    }

    console.log(`[create-order] Nova requisição recebida: ${req.method}`);

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
            status: 405, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
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
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                status: 401, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
        }

        console.log(`[create-order] User authenticated: ${user.email}`);

        // 2. Body Parsing
        const { productId, customerName } = await req.json();
        if (!productId) throw new Error('Product ID required');

        console.log(`[create-order] Product ID: ${productId}`);

        // 3. Get Product
        const { data: product, error: prodError } = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (prodError || !product) {
            console.error('[create-order] Product not found:', prodError);
            throw new Error('Produto não encontrado');
        }

        console.log(`[create-order] Product found: ${product.name} - R$ ${product.price}`);

        // 4. Check Balance
        const { data: wallet, error: walletError } = await supabaseClient
            .from('wallets')
            .select('balance')
            .eq('user_id', user.id)
            .single();

        let currentBalance = 0;
        if (wallet) {
            currentBalance = wallet.balance;
        } else if (walletError && walletError.code !== 'PGRST116') {
            throw walletError;
        }

        console.log(`[create-order] Current balance: R$ ${currentBalance}`);

        if (currentBalance < product.price) {
            return new Response(JSON.stringify({ error: 'Saldo insuficiente. Faça um depósito via PIX.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 5. Execute Transaction
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

        console.log(`[create-order] Balance updated: R$ ${newBalance}`);

        // 5.2 Log Transaction
        await supabaseClient.from('transactions').insert({
            user_id: user.id,
            type: 'purchase',
            amount: product.price,
            status: 'completed',
            description: `Compra: ${product.name}`,
            date: new Date().toISOString()
        });

        // 5.3 Create Order - FIXED: usando credits_amount ao invés de quantity
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .insert({
                user_id: user.id,
                product_id: product.id,
                product_name: product.name,
                price_at_purchase: product.price,
                lovable_email: user.email,
                status: 'completed',
                credits_amount: product.credits_amount, // ✅ CORRETO - usa credits_amount
                delivery_link: null,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (orderError) {
            console.error('[create-order] Order creation error:', orderError);
            throw new Error('Erro ao criar pedido: ' + orderError.message);
        }

        console.log(`[create-order] Order created: ${order.id}`);

        // 6. Trigger Async Fulfillment (Fire and Forget)
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
            console.log(`[create-order] buy-credits triggered: ${res.status}`);
        }).catch(err => {
            console.error(`[create-order] buy-credits error:`, err);
        });

        // @ts-ignore
        if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
            // @ts-ignore
            EdgeRuntime.waitUntil(fulfillmentPromise);
        }

        return new Response(JSON.stringify({ success: true, order }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[create-order] Erro Crítico:', error);
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
})
