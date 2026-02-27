
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL ou Key não encontrados. Verifique seu arquivo .env');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
