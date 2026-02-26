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

    // 1. Auth Check (Must be authenticated user)
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
      .eq('user_id', user.id) // IMPORTANT: User can only cancel their own orders
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Pedido não encontrado ou sem permissão.' }), { status: 404, headers: corsHeaders });
    }

    if (!order.delivery_link) {
      // Se não tem link, não foi "comprado" externamente ainda, ou falhou.
      // Nesse caso, podemos cancelar localmente?
      // Mas o usuário quer acionar o endpoint de cancelamento da API.
      // Se não tem link, não temos o ID externo.
      return new Response(JSON.stringify({ error: 'Pedido não possui link de entrega para cancelamento externo.' }), { status: 400, headers: corsHeaders });
    }

    // 4. Extract External ID from delivery_link
    // Link format: https://pedido.lvbcredits.com/{uuid}
    // or just {uuid} if stored raw?
    // Let's assume URL format.
    let externalId = order.delivery_link;
    try {
      if (externalId.includes('/')) {
        // Remove trailing slash if present
        if (externalId.endsWith('/')) {
          externalId = externalId.slice(0, -1);
        }
        const parts = externalId.split('/');
        externalId = parts[parts.length - 1]; // Last part is UUID
      }

      // Basic UUID validation (optional, but good for debugging)
      if (externalId.length < 10) { // arbitrary short check
        console.warn(`[cancel-order] ID extraído suspeito: ${externalId}`);
      }
    } catch (e) {
      console.error('Error parsing external ID:', e);
      throw new Error('Falha ao extrair ID externo do link.');
    }

    if (!externalId) throw new Error('ID externo inválido.');

    console.log(`[cancel-order] Cancelando pedido externo: ${externalId} (Local: ${orderId})`);

    // 5. Call External API Cancel Endpoint
    const response = await fetch(`${LOVABLE_API_URL}/pedidos/${externalId}/cancelar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": LOVABLE_API_KEY
      }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('Erro na API Lovable (Cancel):', result);
      return new Response(JSON.stringify({ error: 'Erro ao cancelar na API externa', details: result }), { status: 400, headers: corsHeaders });
    }

    // 6. Update Local Order Status if successful
    // The API returns success: true, canceling: true.
    // We can mark status as 'cancelled' or 'refunding'
    // For now, let's update to 'cancelled' to reflect user intent.

    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);

    // 7. Success Response
    return new Response(JSON.stringify({ success: true, data: result.data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Cancel Order Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
