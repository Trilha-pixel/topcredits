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

        // 2. Body Parsing (Adicionado couponId)
        const { productId, customerName, couponId } = await req.json();
        if (!productId) throw new Error('Product ID required');

        console.log(`[create-order] Product ID: ${productId}, Coupon ID: ${couponId || 'Nenhum'}`);

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

        // 4. LÓGICA DE CUPOM (Validação no Backend)
        let discount = 0;
        let validCoupon = null;

        if (couponId) {
            const { data: couponData, error: couponError } = await supabaseClient
                .from('coupons')
                .select('*')
                .eq('id', couponId)
                .eq('is_active', true)
                .single();

            if (couponError || !couponData) {
                throw new Error('Cupom inválido ou inativo');
            }
            if (couponData.current_uses >= couponData.max_uses) {
                throw new Error('Este cupom atingiu o limite de usos');
            }
            if (product.price < couponData.min_purchase_value) {
                throw new Error(`O valor mínimo para usar este cupom é R$ ${couponData.min_purchase_value}`);
            }

            validCoupon = couponData;

            // Calcula o desconto real
            if (couponData.discount_type === 'percentage') {
                discount = product.price * (couponData.discount_value / 100);
            } else {
                discount = couponData.discount_value;
            }
        }

        // Calcula o preço final garantindo que não fique negativo
        const finalPrice = Math.max(product.price - discount, 0);
        console.log(`[create-order] Original: R$ ${product.price}, Desconto: R$ ${discount}, Final: R$ ${finalPrice}`);


        // 5. Check Balance
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

        // Verifica contra o finalPrice, não o product.price
        if (currentBalance < finalPrice) {
            return new Response(JSON.stringify({ error: 'Saldo insuficiente. Faça um depósito via PIX.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 6. Execute Transaction
        // 6.1 Debit Balance (Debita o valor com desconto)
        const newBalance = currentBalance - finalPrice;
        const { error: updateError } = await supabaseClient
            .from('wallets')
            .update({
                balance: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

        if (updateError) throw new Error('Falha ao debitar saldo: ' + updateError.message);

        console.log(`[create-order] Balance updated: R$ ${newBalance}`);

        // 6.2 Increment Coupon Use (Se um cupom foi usado validamente)
        if (validCoupon) {
            await supabaseClient.from('coupons')
                .update({ current_uses: validCoupon.current_uses + 1 })
                .eq('id', validCoupon.id);
        }

        // 6.3 Log Transaction
        await supabaseClient.from('transactions').insert({
            user_id: user.id,
            type: 'purchase',
            amount: finalPrice,
            status: 'completed',
            description: discount > 0 ? `Compra: ${product.name} (Desconto Cupom: R$ ${discount.toFixed(2)})` : `Compra: ${product.name}`,
            date: new Date().toISOString()
        });

        // 6.4 Create Order
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .insert({
                user_id: user.id,
                product_id: product.id,
                product_name: product.name,
                price_at_purchase: finalPrice, // Registra o valor pago
                lovable_email: user.email,
                status: 'completed',
                credits_amount: product.credits_amount,
                delivery_link: null,
                coupon_id: couponId || null, // Salva qual cupom foi usado
                discount_applied: discount, // Salva o valor exato do desconto
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (orderError) {
            console.error('[create-order] Order creation error:', orderError);
            throw new Error('Erro ao criar pedido: ' + orderError.message);
        }

        console.log(`[create-order] Order created: ${order.id}`);

        // 7. Trigger Async Fulfillment (Fire and Forget)
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
