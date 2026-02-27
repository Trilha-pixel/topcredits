-- Habilita a extensão de UUID se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Tabela PROFILES (Estende auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('admin', 'reseller')) DEFAULT 'reseller',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Função auxiliar para verificar admin (Security Definer para evitar recursão)
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

-- Política: Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    public.is_admin()
  );

-- Trigger para criar profile automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'reseller');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- -----------------------------------------------------------------------------
-- 2. Tabela WALLETS
-- -----------------------------------------------------------------------------
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


-- -----------------------------------------------------------------------------
-- 3. Tabela PRODUCTS
-- -----------------------------------------------------------------------------
CREATE TABLE public.products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  credits_amount INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Products (Leitura pública, escrita apenas admin)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (active = true);


-- -----------------------------------------------------------------------------
-- 4. Tabela ORDERS
-- -----------------------------------------------------------------------------
CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  product_id INTEGER REFERENCES public.products(id),
  lovable_email TEXT,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')) DEFAULT 'pending',
  price_at_purchase DECIMAL(10, 2) NOT NULL,
  delivery_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- RLS: Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 5. Tabela TRANSACTIONS
-- -----------------------------------------------------------------------------
CREATE TABLE public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  type TEXT CHECK (type IN ('deposit', 'purchase', 'refund')) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 6. Tabelas ACADEMY
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- SEED DATA (Produtos e Academy - Dados Estáticos)
-- -----------------------------------------------------------------------------

-- Produtos
INSERT INTO public.products (name, credits_amount, price, active) VALUES
('100 Créditos', 100, 45.00, true),
('500 Créditos', 500, 199.00, true),
('1000 Créditos', 1000, 349.00, true),
('2500 Créditos', 2500, 799.00, true);

-- Academy Categories
INSERT INTO public.academy_categories (id, name, icon) VALUES
('cat-1', 'Tráfego Pago', '🎯'),
('cat-2', 'Copywriting', '✍️'),
('cat-3', 'Vendas & Fechamento', '💰'),
('cat-4', 'Lovable na Prática', '⚡');

-- Academy Classes
INSERT INTO public.academy_classes (id, category_id, title, description, video_url, duration, "order") VALUES
('cls-1', 'cat-1', 'Meta Ads para Revenda de Créditos', 'Como criar campanhas lucrativas segmentando desenvolvedores e agências.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '18:32', 1),
('cls-2', 'cat-1', 'Google Ads: Capturando Demanda Ativa', 'Estratégia de search para quem já busca créditos Lovable.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '24:15', 2),
('cls-3', 'cat-2', 'Scripts de Abordagem no WhatsApp', 'Modelos prontos para abordar leads frios e quentes.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '12:48', 1),
('cls-4', 'cat-2', 'Copy para Stories e Reels', 'Frameworks de copy para conteúdo rápido e de alto impacto.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '15:20', 2),
('cls-5', 'cat-3', 'Como Fechar Agências como Clientes', 'Pitch deck e argumentação para vender créditos em volume.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '21:05', 1),
('cls-6', 'cat-3', 'Objeções: "Tá caro" e "Vou pensar"', 'Como rebater as objeções mais comuns na revenda.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '09:40', 2),
('cls-7', 'cat-4', 'Demonstrando o Lovable ao Vivo', 'Como fazer uma demo matadora para converter prospects.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '30:12', 1),
('cls-8', 'cat-4', 'Templates que Vendem Sozinhos', 'Use templates prontos do Lovable como argumento de venda.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', '14:55', 2);

-- Academy Downloads
INSERT INTO public.academy_downloads (id, title, description, file_type, file_url, size) VALUES
('dl-1', 'Funil de Vendas — WhatsApp', 'JSON completo do funil de captação via WhatsApp.', 'json', '#', '42 KB'),
('dl-2', 'Pack de Criativos — Stories', '15 templates editáveis para Canva.', 'zip', '#', '8.3 MB'),
('dl-3', 'Guia do Revendedor — PDF', 'Manual completo com estratégias e scripts.', 'pdf', '#', '2.1 MB'),
('dl-4', 'Planilha de Controle de Clientes', 'Template para gerenciar seus leads e vendas.', 'zip', '#', '156 KB');
