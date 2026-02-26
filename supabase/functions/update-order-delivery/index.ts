import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const LOVABLE_API_URL = "https://lojinhalovable.com/api/v1/revenda"
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Auth Check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization Header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    // 2. Parse Body
    const { orderId, tipoEntrega, emailContaLovable } = await req.json();
    if (!orderId) throw new Error('Order ID required');

    // 3. Get Order Details (Validate Ownership and get external details)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Pedido não encontrado ou sem permissão.' }), { status: 404, headers: corsHeaders });
    }

    if (!order.delivery_link || order.delivery_link === 'PROCESSING_CLAIM') {
      return new Response(JSON.stringify({ error: 'Pedido ainda não tem link externo para configuração.' }), { status: 400, headers: corsHeaders });
    }

    // 4. Extract External ID from delivery_link safely
    let externalId = order.delivery_link;
    if (externalId.includes('/')) {
      if (externalId.endsWith('/')) {
        externalId = externalId.slice(0, -1);
      }
      const parts = externalId.split('/');
      externalId = parts[parts.length - 1]; // Last part is UUID
    }

    if (!externalId) throw new Error('Falha ao extrair ID externo');

    console.log(`[update-order-delivery] Configurando entrega para ID externo: ${externalId}. Tipo: ${tipoEntrega}, Email: ${emailContaLovable}`);

    // 5. Call External API Put Endpoint
    const response = await fetch(`${LOVABLE_API_URL}/pedidos/${externalId}/tipo-entrega`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": LOVABLE_API_KEY
      },
      body: JSON.stringify({
        tipo_entrega: tipoEntrega,
        email_conta_lovable: emailContaLovable
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('Erro na API Lovable (Update Delivery):', result);
      return new Response(JSON.stringify({ error: 'Erro ao configurar entrega', details: result }), { status: 400, headers: corsHeaders });
    }

    // Update local order lovable_email if needed?
    if (emailContaLovable) {
      await supabase.from('orders').update({ lovable_email: emailContaLovable }).eq('id', orderId);
    }

    // 6. Success Response
    return new Response(JSON.stringify({ success: true, data: result.data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Update Order Delivery Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
