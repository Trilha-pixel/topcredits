-- Cria tabela de logs para debug da Edge Function
CREATE TABLE IF NOT EXISTS public.app_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    function_name TEXT,
    step TEXT,
    data JSONB
);

-- Permite insert anonimo para facilitar (em prod removeriamos)
ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for all" ON public.app_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all" ON public.app_logs FOR SELECT USING (true);
