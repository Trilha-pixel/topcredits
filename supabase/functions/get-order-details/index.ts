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
    const { orderId } = await req.json();
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

    if (!order.delivery_link) {
      // Se ainda não tem link, não tem ID externo.
      // Retornamos status local.
      return new Response(JSON.stringify({
        success: true,
        localStatusOnly: true,
        status: order.status,
        etapaProcessamento: 0,
        mensagemBot: null
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Extract External ID from delivery_link safely
    let externalId = order.delivery_link;
    if (externalId === 'PROCESSING_CLAIM') {
      return new Response(JSON.stringify({
        success: true,
        localStatusOnly: true,
        status: 'processing',
        etapaProcessamento: 1, // Processing claim
        mensagemBot: 'Solicitando licença...'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if it's a URL or just ID (handling trailing slash too)
    try {
      if (externalId.includes('/')) {
        if (externalId.endsWith('/')) {
          externalId = externalId.slice(0, -1);
        }
        const parts = externalId.split('/');
        externalId = parts[parts.length - 1]; // Last part is UUID
      }
    } catch (e) {
      // If extraction fails, return basic info
      console.error('Error extracting ID:', e);
      return new Response(JSON.stringify({
        success: true,
        localStatusOnly: true,
        status: order.status,
        etapaProcessamento: 0,
        error: 'Failed to extract external ID'
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 5. Call External API Get Details Endpoint
    console.log(`[get-order-details] Buscando detalhes para ID externo: ${externalId}`);

    const response = await fetch(`${LOVABLE_API_URL}/pedidos/${externalId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": LOVABLE_API_KEY
      }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('Erro na API Lovable (Get Details):', result);
      // Fallback to local data if API fails (maybe order not found there?)
      return new Response(JSON.stringify({
        success: true,
        localStatusOnly: true,
        status: order.status,
        apiError: result
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 6. Success Response with External Data
    return new Response(JSON.stringify({ success: true, data: result.data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get Order Details Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
