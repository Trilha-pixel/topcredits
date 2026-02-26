
// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
    // 1. Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 2. Auth Check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization Header');
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized', details: userError }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 3. Body Parsing
        let body;
        try { body = await req.json(); } catch (e) { return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400, headers: corsHeaders }); }

        const { amount, name, cpfCnpj, email } = body;
        const asaasUrl = Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com';
        const asaasKey = Deno.env.get('ASAAS_API_KEY');

        if (!asaasKey) throw new Error('ASAAS_API_KEY missing');

        // 4. Asaas Logic
        // Busca ou Cria Cliente
        let customerId = '';
        const searchRes = await fetch(`${asaasUrl}/v3/customers?cpfCnpj=${cpfCnpj}`, { headers: { 'access_token': asaasKey } });
        const searchData = await searchRes.json();

        if (searchData.data && searchData.data.length > 0) {
            customerId = searchData.data[0].id;
        } else {
            const createRes = await fetch(`${asaasUrl}/v3/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'access_token': asaasKey },
                body: JSON.stringify({ name, cpfCnpj, email: email || user.email, externalReference: user.id })
            });
            if (!createRes.ok) throw new Error(`Erro criar cliente Asaas: ${(await createRes.json()).errors?.[0]?.description}`);
            customerId = (await createRes.json()).id;
        }

        // Cria PIX
        const today = new Date().toISOString().split('T')[0];
        const payRes = await fetch(`${asaasUrl}/v3/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'access_token': asaasKey },
            body: JSON.stringify({
                customer: customerId, billingType: 'PIX', value: amount, dueDate: today,
                description: `Recarga Top Credits`, externalReference: user.id
            })
        });

        if (!payRes.ok) throw new Error(`Erro criar cobrança Asaas: ${(await payRes.json()).errors?.[0]?.description}`);
        const paymentData = await payRes.json();

        // Pega QR Code
        const qrRes = await fetch(`${asaasUrl}/v3/payments/${paymentData.id}/pixQrCode`, { headers: { 'access_token': asaasKey } });
        if (!qrRes.ok) throw new Error('Falha ao obter QR Code');

        const qrData = await qrRes.json();

        // Retorna JSON plano para facilitar frontend
        return new Response(JSON.stringify({
            success: true,
            paymentId: paymentData.id,
            payload: qrData.payload,
            encodedImage: qrData.encodedImage
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Function Error:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
})
