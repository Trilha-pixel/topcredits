// Edge Function: buy-credits
// Processa a entrega automática de créditos Lovable via LVB Credits API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LVB_API_BASE = 'https://api.lvbcredits.com'

interface OrderRecord {
  id: string
  user_id: string
  product_id: number
  quantity: number
  lovable_email: string
  price_at_purchase: number
}

serve(async (req) => {
  // Handle CORS preflight - MUST return 200 status
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const lvbApiKey = Deno.env.get('LVB_CREDITS_API_KEY')
    
    if (!lvbApiKey) {
      throw new Error('LVB_CREDITS_API_KEY não configurada')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse request body - expecting { record: OrderRecord }
    const { record } = await req.json()
    console.log('[buy-credits] Processing order:', record.id)

    // 1. Criar pedido na API do LVB Credits
    console.log('[buy-credits] Creating order in LVB Credits API...')
    const lvbResponse = await fetch(`${LVB_API_BASE}/api/v1/revenda/pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lvbApiKey}`
      },
      body: JSON.stringify({
        creditos: record.quantity
      })
    })

    if (!lvbResponse.ok) {
      const errorData = await lvbResponse.json().catch(() => ({}))
      throw new Error(`LVB API Error: ${errorData.error || lvbResponse.statusText}`)
    }

    const lvbData = await lvbResponse.json()
    console.log('[buy-credits] LVB Order created:', lvbData.data.pedidoId)

    // 2. Configurar entrega por email
    console.log('[buy-credits] Setting delivery type to email...')
    const deliveryResponse = await fetch(
      `${LVB_API_BASE}/api/v1/revenda/pedidos/${lvbData.data.pedidoId}/tipo-entrega`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lvbApiKey}`
        },
        body: JSON.stringify({
          tipo: 'email',
          dados: {
            email: record.lovable_email
          }
        })
      }
    )

    if (!deliveryResponse.ok) {
      console.error('[buy-credits] Failed to set delivery type')
    }

    // 3. Atualizar pedido local com informações do LVB
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        delivery_link: lvbData.data.linkCliente,
        external_order_id: lvbData.data.pedidoId,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', record.id)

    if (updateError) {
      console.error('[buy-credits] Error updating order:', updateError)
      throw new Error(`Erro ao atualizar pedido: ${updateError.message}`)
    }

    console.log('[buy-credits] Order processed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        order_id: record.id,
        lvb_order_id: lvbData.data.pedidoId,
        delivery_link: lvbData.data.linkCliente,
        message: 'Créditos entregues com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('[buy-credits] Error processing delivery:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
