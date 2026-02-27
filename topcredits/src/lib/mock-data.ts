export type UserRole = 'admin' | 'reseller';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface Wallet {
  user_id: string;
  balance: number;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  credits_amount: number;
  price: number;
  active: boolean;
}

export interface Order {
  id: string;
  user_id: string;
  user_name: string;
  product_id: number;
  product_name: string;
  lovable_email: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  price_at_purchase: number;
  created_at: string;
  completed_at: string | null;
  delivery_link: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'purchase' | 'refund';
  amount: number;
  external_id: string | null;
  created_at: string;
}

export const mockUsers: Profile[] = [
  { id: '1', full_name: 'Felipe Admin', email: 'admin@forfy.com', role: 'admin', is_active: true },
  { id: '2', full_name: 'João Revendedor', email: 'joao@email.com', role: 'reseller', is_active: true },
  { id: '3', full_name: 'Maria Silva', email: 'maria@email.com', role: 'reseller', is_active: true },
  { id: '4', full_name: 'Carlos Santos', email: 'carlos@email.com', role: 'reseller', is_active: false },
];

export const mockWallets: Wallet[] = [
  { user_id: '2', balance: 1250.00, updated_at: '2026-02-10T14:30:00Z' },
  { user_id: '3', balance: 450.00, updated_at: '2026-02-09T10:00:00Z' },
  { user_id: '4', balance: 0.00, updated_at: '2026-01-15T08:00:00Z' },
];

export const mockProducts: Product[] = [
  { id: 1, name: '100 Créditos', credits_amount: 100, price: 45.00, active: true },
  { id: 2, name: '500 Créditos', credits_amount: 500, price: 199.00, active: true },
  { id: 3, name: '1000 Créditos', credits_amount: 1000, price: 349.00, active: true },
  { id: 4, name: '2500 Créditos', credits_amount: 2500, price: 799.00, active: true },
];

export const mockOrders: Order[] = [
  { id: 'ord-001', user_id: '2', user_name: 'João Revendedor', product_id: 2, product_name: '500 Créditos', lovable_email: 'joao.client@gmail.com', status: 'pending', price_at_purchase: 199.00, created_at: '2026-02-10T13:45:00Z', completed_at: null, delivery_link: null },
  { id: 'ord-002', user_id: '3', user_name: 'Maria Silva', product_id: 3, product_name: '1000 Créditos', lovable_email: 'maria.proj@outlook.com', status: 'pending', price_at_purchase: 349.00, created_at: '2026-02-10T12:20:00Z', completed_at: null, delivery_link: null },
  { id: 'ord-003', user_id: '2', user_name: 'João Revendedor', product_id: 1, product_name: '100 Créditos', lovable_email: 'joao.test@gmail.com', status: 'completed', price_at_purchase: 45.00, created_at: '2026-02-09T16:00:00Z', completed_at: '2026-02-09T16:30:00Z', delivery_link: 'https://lovable.dev/credits/abc123' },
  { id: 'ord-004', user_id: '3', user_name: 'Maria Silva', product_id: 2, product_name: '500 Créditos', lovable_email: 'maria.old@outlook.com', status: 'cancelled', price_at_purchase: 199.00, created_at: '2026-02-08T09:00:00Z', completed_at: null, delivery_link: null },
  { id: 'ord-005', user_id: '2', user_name: 'João Revendedor', product_id: 4, product_name: '2500 Créditos', lovable_email: 'joao.big@gmail.com', status: 'processing', price_at_purchase: 799.00, created_at: '2026-02-10T14:00:00Z', completed_at: null, delivery_link: null },
];

export const mockTransactions: Transaction[] = [
  { id: 'tx-001', user_id: '2', type: 'deposit', amount: 1500.00, external_id: 'asaas_pay_001', created_at: '2026-02-08T10:00:00Z' },
  { id: 'tx-002', user_id: '2', type: 'purchase', amount: -199.00, external_id: null, created_at: '2026-02-09T16:00:00Z' },
  { id: 'tx-003', user_id: '2', type: 'purchase', amount: -45.00, external_id: null, created_at: '2026-02-09T16:00:00Z' },
  { id: 'tx-004', user_id: '3', type: 'deposit', amount: 650.00, external_id: 'asaas_pay_002', created_at: '2026-02-07T14:00:00Z' },
  { id: 'tx-005', user_id: '3', type: 'purchase', amount: -199.00, external_id: null, created_at: '2026-02-08T09:00:00Z' },
  { id: 'tx-006', user_id: '3', type: 'refund', amount: 199.00, external_id: null, created_at: '2026-02-08T09:30:00Z' },
];

// Academy
export interface ContentCategory {
  id: string;
  name: string;
  icon: string;
}

export interface ContentClass {
  id: string;
  category_id: string;
  title: string;
  description: string;
  video_url: string;
  duration: string;
  order: number;
}

export interface DownloadItem {
  id: string;
  title: string;
  description: string;
  file_type: 'json' | 'pdf' | 'zip';
  file_url: string;
  size: string;
}

export const mockCategories: ContentCategory[] = [
  { id: 'cat-1', name: 'Tráfego Pago', icon: '🎯' },
  { id: 'cat-2', name: 'Copywriting', icon: '✍️' },
  { id: 'cat-3', name: 'Vendas & Fechamento', icon: '💰' },
  { id: 'cat-4', name: 'Lovable na Prática', icon: '⚡' },
];

export const mockClasses: ContentClass[] = [
  { id: 'cls-1', category_id: 'cat-1', title: 'Meta Ads para Revenda de Créditos', description: 'Como criar campanhas lucrativas segmentando desenvolvedores e agências.', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '18:32', order: 1 },
  { id: 'cls-2', category_id: 'cat-1', title: 'Google Ads: Capturando Demanda Ativa', description: 'Estratégia de search para quem já busca créditos Lovable.', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '24:15', order: 2 },
  { id: 'cls-3', category_id: 'cat-2', title: 'Scripts de Abordagem no WhatsApp', description: 'Modelos prontos para abordar leads frios e quentes.', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '12:48', order: 1 },
  { id: 'cls-4', category_id: 'cat-2', title: 'Copy para Stories e Reels', description: 'Frameworks de copy para conteúdo rápido e de alto impacto.', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '15:20', order: 2 },
  { id: 'cls-5', category_id: 'cat-3', title: 'Como Fechar Agências como Clientes', description: 'Pitch deck e argumentação para vender créditos em volume.', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '21:05', order: 1 },
  { id: 'cls-6', category_id: 'cat-3', title: 'Objeções: "Tá caro" e "Vou pensar"', description: 'Como rebater as objeções mais comuns na revenda.', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '09:40', order: 2 },
  { id: 'cls-7', category_id: 'cat-4', title: 'Demonstrando o Lovable ao Vivo', description: 'Como fazer uma demo matadora para converter prospects.', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '30:12', order: 1 },
  { id: 'cls-8', category_id: 'cat-4', title: 'Templates que Vendem Sozinhos', description: 'Use templates prontos do Lovable como argumento de venda.', video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '14:55', order: 2 },
];

export const mockDownloads: DownloadItem[] = [
  { id: 'dl-1', title: 'Funil de Vendas — WhatsApp', description: 'JSON completo do funil de captação via WhatsApp.', file_type: 'json', file_url: '#', size: '42 KB' },
  { id: 'dl-2', title: 'Pack de Criativos — Stories', description: '15 templates editáveis para Canva.', file_type: 'zip', file_url: '#', size: '8.3 MB' },
  { id: 'dl-3', title: 'Guia do Revendedor — PDF', description: 'Manual completo com estratégias e scripts.', file_type: 'pdf', file_url: '#', size: '2.1 MB' },
  { id: 'dl-4', title: 'Planilha de Controle de Clientes', description: 'Template para gerenciar seus leads e vendas.', file_type: 'zip', file_url: '#', size: '156 KB' },
];
