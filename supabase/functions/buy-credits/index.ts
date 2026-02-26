import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const LOVABLE_API_URL = "https://lojinhalovable.com/api/v1/revenda"
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const LOVABLE_API_KEY = (Deno.env.get('LOVABLE_API_KEY') || "").trim()

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
})

// Espera aleatória (Jitter) para evitar conflito
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

serve(async (req) => {
    try {
        const payload = await req.json()
        const orderData = payload.record || payload

        console.log(`📦 Processando pedido ${orderData.id} | Status: ${orderData.status}`)

        // 1. FILTRO DE STATUS
        if (orderData.status !== 'completed' && orderData.status !== 'paid') {
            return new Response("Ignorado: Status não pago.", { status: 200 })
        }

        // 2. A GRANDE MUDANÇA (Bloqueio se já tiver Link ou Erro)
        // Se o link já existe (mesmo que seja 'ERRO'), a gente para.
        if (orderData.delivery_link && orderData.delivery_link !== '') {
            console.log("🛑 Pedido já processado (tem link ou erro salvo). Parando.");
            return new Response(JSON.stringify({ message: "Duplicidade evitada pelo código." }), { status: 200 });
        }

        // 3. TRAVA DE BANCO (LOCK)
        const delay = Math.floor(Math.random() * 1000) + 500;
        await wait(delay);

        const { data: claimData } = await supabase
            .from('orders')
            .update({ delivery_link: 'PROCESSANDO...' }) // Trava temporária
            .eq('id', orderData.id)
            .is('delivery_link', null) // SÓ PEGA SE FOR NULL
            .select();

        if (!claimData || claimData.length === 0) {
            return new Response(JSON.stringify({ message: "Já estava sendo processado." }), { status: 200 });
        }

        // 4. COMPRA
        const creditsToBuy = parseInt(String(orderData.quantity), 10);
        // Fallback de email seguro
        const userEmail = orderData.lovable_email || orderData.email || "cliente@loja.com";

        if (!creditsToBuy || creditsToBuy <= 0) {
            await supabase.from('orders').update({ delivery_link: 'ERRO_QUANTIDADE' }).eq('id', orderData.id);
            return new Response(JSON.stringify({ error: "Qtd inválida" }), { status: 400 })
        }

        const requestBody = JSON.stringify({
            creditos: creditsToBuy,
            email_conta_lovable: null // Tentativa de forçar não auto-associar
        });
        console.log(`📡 Comprando ${creditsToBuy} créditos... Body: ${requestBody}`);

        const response = await fetch(`${LOVABLE_API_URL}/pedidos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": LOVABLE_API_KEY,
                "User-Agent": "TopCredits/1.0"
            },
            body: requestBody,
        })

        const result = await response.json()

        if (result.success) {
            console.log("✅ Pedido Criado. Dados retornados:", JSON.stringify(result.data));
        }

        // 5. CHECAGEM e RECUPERAÇÃO DE ERRO
        if (!response.ok || !result.success) {
            console.error("❌ Erro inicial API Lovable:", result);

            // TENTATIVA DE RECUPERAÇÃO (FALLBACK)
            // Se a API disse que falhou, mas criou o pedido (Bug 'Ghost Order'), vamos tentar achá-lo.
            console.log("🕵️‍♂️ Tentando recuperar pedido fantasma...");

            try {
                // Aguarda 2s para garantir que a API Lovable indexou o pedido recém-criado
                await wait(2000);

                const listResponse = await fetch(`${LOVABLE_API_URL}/pedidos?limit=5`, {
                    headers: { "X-API-Key": LOVABLE_API_KEY, "User-Agent": "TopCredits/1.0" }
                });
                const listResult = await listResponse.json();

                if (listResult.success && listResult.data?.pedidos) {
                    // Procura um pedido com MESMA quantidade e criado nos últimos 2 minutos
                    const match = listResult.data.pedidos.find((p: any) => {
                        const timeDiff = Math.abs(new Date(p.criadoEm).getTime() - Date.now());
                        return p.creditos === creditsToBuy && timeDiff < 120000; // 2 min tolerância
                    });

                    if (match) {
                        console.log("✅ PEDIDO RECUPERADO COM SUCESSO!", match.id);
                        // Substitui o erro pelo sucesso encontrado
                        result.success = true;
                        result.data = {
                            pedidoId: match.id,
                            linkCliente: match.linkCliente,
                            status: match.status
                        };
                        // Segue o fluxo normal...
                    } else {
                        throw new Error("Nenhum pedido correspondente encontrado.");
                    }
                }
            } catch (recoveryError) {
                console.error("⚠️ Falha na recuperação:", recoveryError);
                // Se recuperação falhar, aí sim gravamos o erro original
                await supabase.from('orders')
                    .update({ delivery_link: `ERRO_API: ${result.code || 'Falha Interna'}` })
                    .eq('id', orderData.id);
                return new Response(JSON.stringify({ error: "Erro API Lovable", details: result }), { status: 400 })
            }
        }

        // Se chegou aqui, ou deu sucesso de primeira, ou foi recuperado.
        if (!result.success) {
            // Safety check redundante
            return new Response(JSON.stringify({ error: "Erro desconhecido" }), { status: 400 });
        }

        // 6. SUCESSO - Configura entrega e salva
        const pedidoExternoId = result.data.pedidoId;
        let finalLink = result.data.linkCliente;

        // Tenta configurar workspace_novo (opcional, não falha se der erro)
        if (pedidoExternoId) {
            try {
                const putRes = await fetch(`${LOVABLE_API_URL}/pedidos/${pedidoExternoId}/tipo-entrega`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", "X-API-Key": LOVABLE_API_KEY },
                    body: JSON.stringify({ tipo_entrega: "workspace_novo", email_conta_lovable: userEmail })
                });
                const putData = await putRes.json();
                if (putData.success && putData.data?.linkCliente) finalLink = putData.data.linkCliente;
            } catch (e) { console.error("Erro config entrega:", e); }
        }

        await supabase
            .from('orders')
            .update({
                delivery_link: finalLink,
                quantity: creditsToBuy
            })
            .eq('id', orderData.id);

        return new Response(JSON.stringify({ success: true, link: finalLink }), { status: 200 })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
