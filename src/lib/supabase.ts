
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERRO CRÍTICO: Supabase URL ou Key não encontrados!');
    console.error('Verifique se o arquivo .env existe e contém:');
    console.error('- VITE_SUPABASE_URL');
    console.error('- VITE_SUPABASE_ANON_KEY');
} else {
    console.log('✅ Supabase configurado:', {
        url: supabaseUrl,
        project: supabaseUrl.split('.')[0].replace('https://', ''),
        keyPrefix: supabaseKey.substring(0, 20) + '...'
    });
}

// Criar cliente com configurações otimizadas para CORS
export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    },
    global: {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'apikey': supabaseKey || ''
        }
    },
    db: {
        schema: 'public'
    }
});

// Log de inicialização
console.log('🚀 Supabase client initialized');

