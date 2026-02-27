import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const LVB_API_URL = "https://api.lvbcredits.com/api/v1/revenda"
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Garante chave limpa
const LVB_API_KEY = (Deno.env.get('LVB_CREDITS_API_KEY') || "").trim()

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Espera aleatória (Jitter) para evitar race conditions
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

serve(async (req) => {
  try {
    const payload = await req.json()
    const orderData = payload.record || payload
    
    console.log(`📦 Processando pedido ${orderData.id} | Status: ${orderData.status}`)
    console.log(`📊 Dados completos:`, JSON.stringify(orderData, null, 2))

    // 1. FILTRO DE STATUS
    if (orderData.status !== 'completed' && orderData.status !== 'paid') {
      return new Response("Ignorado: Status não pago.", { status: 200 })
    }

    // 2. TRAVA DE DUPLICIDADE (Se já tem link, para)
    if (orderData.delivery_link && orderData.delivery_link !== '') {
      console.log("🛑 Pedido já processado. Parando.")
      return new Response(JSON.stringify({ message: "Duplicidade evitada." }), { status: 200 })
    }

    // 3. TRAVA DE BANCO (LOCK) - Evita processamento duplicado
    const delay = Math.floor(Math.random() * 1000) + 500
    await wait(delay)

    const { data: claimData } = await supabase
      .from('orders')
      .update({ delivery_link: 'GERANDO LINK...' })
      .eq('id', orderData.id)
      .is('delivery_link', null)
      .select()

    if (!claimData || claimData.length === 0) {
      return new Response(JSON.stringify({ message: "Já estava sendo processado." }), { status: 200 })
    }

    // 4. PREPARAÇÃO - TENTA MÚLTIPLOS CAMPOS
    console.log(`🔍 credits_amount:`, orderData.credits_amount)
    console.log(`🔍 quantity:`, orderData.quantity)
    console.log(`🔍 product_id:`, orderData.product_id)
    
    // Tenta pegar de credits_amount ou quantity (fallback)
    let creditsToBuy = parseInt(String(orderData.credits_amount || orderData.quantity || 0), 10)
    
    console.log(`🔍 creditsToBuy parsed:`, creditsToBuy)
    
    if (!creditsToBuy || creditsToBuy <= 0) {
      console.error(`❌ Quantidade inválida: ${creditsToBuy}`)
      console.error(`❌ orderData.credits_amount:`, orderData.credits_amount)
      console.error(`❌ orderData.quantity:`, orderData.quantity)
      
      await supabase
        .from('orders')
        .update({ delivery_link: `ERRO_QUANTIDADE (valor: ${creditsToBuy})` })
        .eq('id', orderData.id)
      
      return new Response(JSON.stringify({ 
        error: "Qtd inválida",
        credits_amount: orderData.credits_amount,
        quantity: orderData.quantity,
        parsed: creditsToBuy
      }), { status: 400 })
    }

    console.log(`📡 Criando pedido de ${creditsToBuy} créditos...`)

    // 5. COMPRA (POST) - APENAS CRIA, NÃO CONFIGURA
    const response = await fetch(`${LVB_API_URL}/pedidos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": LVB_API_KEY,
        "User-Agent": "TopCredits/1.0"
      },
      body: JSON.stringify({ creditos: creditsToBuy })
    })

    const result = await response.json()

    // TRATAMENTO DE ERRO
    if (!response.ok || !result.success) {
      console.error("❌ Erro API LVB:", result)
      
      // Grava o erro no link para parar o loop e permitir análise
      await supabase
        .from('orders')
        .update({ delivery_link: `ERRO_API: ${result.code || 'Falha'}` })
        .eq('id', orderData.id)
      
      return new Response(
        JSON.stringify({ error: "Erro API LVB", details: result }), 
        { status: 400 }
      )
    }

    // 6. SUCESSO - PEGA O LINK E SALVA
    const finalLink = result.data.linkCliente
    const externalOrderId = result.data.pedidoId

    console.log(`✅ Link Gerado: ${finalLink}`)
    console.log(`📋 ID Externo: ${externalOrderId}`)

    await supabase
      .from('orders')
      .update({
        delivery_link: finalLink,
        external_order_id: externalOrderId,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', orderData.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        link: finalLink,
        external_order_id: externalOrderId,
        credits: creditsToBuy
      }), 
      { status: 200 }
    )

  } catch (error: any) {
    console.error("💥 Erro crítico:", error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500 }
    )
  }
})
