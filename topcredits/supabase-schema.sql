-- Habilita a extensão de UUID se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------------
-- 1. Tabela PROFILES (Estende auth.users)
-- -------------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('admin', 'customer')) DEFAULT 'customer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar se é admin (evita recursão infinita)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Política: Admins podem ver todos os perfis (usando função segura)
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- Trigger para criar profile automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'customer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- -------------------------------------------------------------------------------
-- 2. Tabela WALLETS
-- -------------------------------------------------------------------------------
CREATE TABLE public.wallets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_wallet UNIQUE (user_id)
);

-- RLS: Wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Trigger para criar wallet automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance)
  VALUES (new.id, 0.00);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_wallet();

-- -------------------------------------------------------------------------------
-- 3. Tabela PRODUCTS (Pacotes de Créditos Lovable)
-- -------------------------------------------------------------------------------
CREATE TABLE public.products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  credits_amount INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Products (Leitura pública, escrita apenas admin)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (active = true);

-- -------------------------------------------------------------------------------
-- 4. Tabela ORDERS (Pedidos de Créditos Lovable)
-- -------------------------------------------------------------------------------
CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  product_id INTEGER REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  credits_amount INTEGER NOT NULL,
  lovable_email TEXT,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')) DEFAULT 'pending',
  price_at_purchase DECIMAL(10, 2) NOT NULL,
  delivery_link TEXT,
  delivery_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- RLS: Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------------------------------
-- 5. Tabela TRANSACTIONS
-- -------------------------------------------------------------------------------
CREATE TABLE public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  type TEXT CHECK (type IN ('deposit', 'purchase', 'refund', 'token_purchase')) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

-- -------------------------------------------------------------------------------
-- 6. Tabela LICENSES_TOKENS (Tokens para Licenças)
-- -------------------------------------------------------------------------------
CREATE TABLE public.licenses_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  token_balance INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_tokens UNIQUE (user_id)
);

-- RLS: Licenses Tokens
ALTER TABLE public.licenses_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tokens" ON public.licenses_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Trigger para criar tokens automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user_tokens()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.licenses_tokens (user_id, token_balance)
  VALUES (new.id, 0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_tokens
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_tokens();

-- -------------------------------------------------------------------------------
-- 7. Tabela LICENSES_CONFIG (Configuração da API de Licenças)
-- -------------------------------------------------------------------------------
CREATE TABLE public.licenses_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  api_key TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_config CHECK (id = 1)
);

-- RLS: Licenses Config (Apenas admins)
ALTER TABLE public.licenses_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view config" ON public.licenses_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -------------------------------------------------------------------------------
-- 8. Tabelas ACADEMY (Conteúdo Educacional)
-- -------------------------------------------------------------------------------

-- Academy Categories
CREATE TABLE public.academy_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  "order" INTEGER DEFAULT 0
);

ALTER TABLE public.academy_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read academy categories" ON public.academy_categories FOR SELECT USING (true);

-- Academy Classes
CREATE TABLE public.academy_classes (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES public.academy_categories(id),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration TEXT,
  "order" INTEGER DEFAULT 0
);

ALTER TABLE public.academy_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read academy classes" ON public.academy_classes FOR SELECT USING (true);

-- Academy Downloads
CREATE TABLE public.academy_downloads (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_type TEXT CHECK (file_type IN ('json', 'pdf', 'zip')),
  file_url TEXT,
  size TEXT
);

ALTER TABLE public.academy_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read academy downloads" ON public.academy_downloads FOR SELECT USING (true);

-- -------------------------------------------------------------------------------
-- SEED DATA (Produtos e Academy)
-- -------------------------------------------------------------------------------

-- Produtos (Pacotes de Créditos Lovable)
INSERT INTO public.products (name, credits_amount, price, description, active) VALUES
('Pacote Starter', 100, 45.00, 'Ideal para começar seus projetos', true),
('Pacote Pro', 500, 199.00, 'Perfeito para desenvolvedores ativos', true),
('Pacote Business', 1000, 349.00, 'Para projetos de médio porte', true),
('Pacote Enterprise', 2500, 799.00, 'Máximo poder para grandes projetos', true);

-- Academy Categories (Focado em B2C - Uso de Créditos Lovable)
INSERT INTO public.academy_categories (id, name, icon, "order") VALUES
('cat-1', 'Primeiros Passos', '🚀', 1),
('cat-2', 'Desenvolvimento', '💻', 2),
('cat-3', 'Dicas Avançadas', '⚡', 3),
('cat-4', 'Extensão Lovable', '🔧', 4);

-- Academy Classes (Conteúdo B2C)
INSERT INTO public.academy_classes (id, category_id, title, description, video_url, duration, "order") VALUES
('cls-1', 'cat-1', 'Como Comprar Créditos Lovable', 'Aprenda a comprar e usar seus créditos na plataforma.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '08:30', 1),
('cls-2', 'cat-1', 'Configurando sua Conta Lovable', 'Passo a passo para configurar e começar a usar.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '12:15', 2),
('cls-3', 'cat-2', 'Criando seu Primeiro Projeto', 'Tutorial completo para criar projetos no Lovable.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '25:48', 1),
('cls-4', 'cat-2', 'Otimizando o Uso de Créditos', 'Dicas para aproveitar melhor seus créditos.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '15:20', 2),
('cls-5', 'cat-3', 'Templates Prontos para Usar', 'Biblioteca de templates que economizam créditos.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '18:05', 1),
('cls-6', 'cat-3', 'Truques de Desenvolvimento', 'Técnicas avançadas para desenvolver mais rápido.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '22:40', 2),
('cls-7', 'cat-4', 'Instalando a Extensão', 'Como instalar e ativar a extensão de créditos infinitos.', 'https://player.vimeo.com/video/1164109842', '10:12', 1),
('cls-8', 'cat-4', 'Usando Créditos Infinitos', 'Aprenda a usar a extensão para maximizar seus projetos.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '14:55', 2);

-- Academy Downloads (Recursos B2C)
INSERT INTO public.academy_downloads (id, title, description, file_type, file_url, size) VALUES
('dl-1', 'Guia Rápido Lovable', 'PDF com dicas essenciais para começar.', 'pdf', '#', '1.2 MB'),
('dl-2', 'Templates de Projetos', 'Pack com 10 templates prontos para usar.', 'zip', '#', '5.8 MB'),
('dl-3', 'Checklist de Desenvolvimento', 'Lista completa para otimizar seus projetos.', 'pdf', '#', '890 KB'),
('dl-4', 'Extensão Lovable', 'Arquivo de instalação da extensão.', 'zip', '#', '2.4 MB');
