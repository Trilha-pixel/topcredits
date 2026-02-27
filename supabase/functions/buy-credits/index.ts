// Edge Function: buy-credits
// Processa a entrega automática de créditos Lovable quando um pedido é pago

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderPayload {
  order_id: string
  user_id: string
  product_id: number
  credits_amount: number
  lovable_email: string
  price: number
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
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse request body
    const payload: OrderPayload = await req.json()
    console.log('Processing order:', payload.order_id)

    // 1. Gerar código único de resgate
    const deliveryCode = generateDeliveryCode()
    
    // 2. Buscar link base do produto
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('delivery_link')
      .eq('id', payload.product_id)
      .single()

    if (productError) {
      throw new Error(`Erro ao buscar produto: ${productError.message}`)
    }

    // 3. Construir link de entrega completo
    const baseLink = product.delivery_link || 'https://lovable.dev/redeem'
    const deliveryLink = `${baseLink}?code=${deliveryCode}&credits=${payload.credits_amount}&email=${encodeURIComponent(payload.lovable_email)}`

    // 4. Atualizar pedido com link de entrega
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        delivery_link: deliveryLink,
        delivery_code: deliveryCode,
        completed_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', payload.order_id)

    if (updateError) {
      throw new Error(`Erro ao atualizar pedido: ${updateError.message}`)
    }

    // 5. Registrar transação de compra (se ainda não existir)
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: payload.user_id,
        type: 'purchase',
        amount: -payload.price,
        description: `Compra de ${payload.credits_amount} créditos Lovable`
      })

    if (transactionError) {
      console.error('Erro ao registrar transação:', transactionError)
      // Não falha a entrega se a transação falhar
    }

    // 6. TODO: Integrar com API do Lovable para entrega real
    // const lovableResponse = await deliverToLovable({
    //   email: payload.lovable_email,
    //   credits: payload.credits_amount,
    //   code: deliveryCode
    // })

    // 7. TODO: Enviar email de confirmação ao cliente
    // await sendConfirmationEmail({
    //   email: payload.lovable_email,
    //   deliveryLink: deliveryLink,
    //   credits: payload.credits_amount
    // })

    console.log('Entrega processada com sucesso:', {
      order_id: payload.order_id,
      delivery_code: deliveryCode
    })

    return new Response(
      JSON.stringify({
        success: true,
        order_id: payload.order_id,
        delivery_code: deliveryCode,
        delivery_link: deliveryLink,
        message: 'Créditos entregues com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erro ao processar entrega:', error)
    
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

// Gera código único de resgate (12 caracteres alfanuméricos)
function generateDeliveryCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Remove caracteres ambíguos
  let code = ''
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// TODO: Implementar integração com Lovable
// async function deliverToLovable(data: {
//   email: string
//   credits: number
//   code: string
// }) {
//   // Chamar API do Lovable para entregar créditos
//   const response = await fetch('https://api.lovable.dev/credits/deliver', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`
//     },
//     body: JSON.stringify(data)
//   })
//   return response.json()
// }

// TODO: Implementar envio de email
// async function sendConfirmationEmail(data: {
//   email: string
//   deliveryLink: string
//   credits: number
// }) {
//   // Usar Resend, SendGrid, ou outro serviço de email
//   // const response = await fetch('https://api.resend.com/emails', {
//   //   method: 'POST',
//   //   headers: {
//   //     'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
//   //     'Content-Type': 'application/json'
//   //   },
//   //   body: JSON.stringify({
//   //     from: 'Top Créditos <noreply@topcreditos.com.br>',
//   //     to: data.email,
//   //     subject: `Seus ${data.credits} créditos Lovable estão prontos!`,
//   //     html: `
//   //       <h1>Créditos Lovable Entregues!</h1>
//   //       <p>Seus ${data.credits} créditos foram entregues com sucesso.</p>
//   //       <p><a href="${data.deliveryLink}">Clique aqui para resgatar</a></p>
//   //     `
//   //   })
//   // })
//   // return response.json()
// }
